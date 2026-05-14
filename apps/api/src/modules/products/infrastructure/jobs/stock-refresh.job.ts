import type { FastifyInstance } from "fastify";
import cron from "node-cron";
import { createOmieStockCache } from "@/shared/integrations/omie";
import { createSyncLockLeaseRepoPrisma } from "../db/sync-lock-lease.repo.prisma";
import { createProductStockRepoPrisma } from "../db/product-stock.repo.prisma";

type LoggerLike = {
  info: (obj: any, msg?: string) => void;
  warn: (obj: any, msg?: string) => void;
  error: (obj: any, msg?: string) => void;
};

function resolveLogger(input: FastifyInstance | LoggerLike): LoggerLike {
  const maybeFastify = input as FastifyInstance;
  const maybeLogger = input as LoggerLike;

  if (maybeFastify && typeof (maybeFastify as any).log?.info === "function") {
    return (maybeFastify as any).log as LoggerLike;
  }

  return maybeLogger;
}

// Lógica de refresh de estoque extraída do use case
async function refreshStockLogic(deps: {
  omieStockCache: any;
  syncLockLeaseRepo: any;
  productStockRepo: any;
  logger: LoggerLike;
}) {
  const STOCK_REFRESH_LOCK_KEY = "stock_refresh";
  const STOCK_REFRESH_LOCK_TTL_MS = 10 * 60 * 1000;
  const EXPECTED_OMIE_CODE_LENGTH = 64;
  const MAX_DECIMAL_INTEGER_DIGITS = 14;
  const BATCH_SIZE = 200;
  const MAX_WARN_LOGS = 10;

  // Tentar adquirir lock
  const lockAcquired = await deps.syncLockLeaseRepo.acquire(
    STOCK_REFRESH_LOCK_KEY,
    STOCK_REFRESH_LOCK_TTL_MS
  );

  if (!lockAcquired) {
    return {
      insertedCount: 0,
      meta: { skippedLocked: 1 },
    };
  }

  try {
    // Atualizar cache
    await deps.omieStockCache.refreshNow();
    const capturedAt = new Date();
    const snapshot = await deps.omieStockCache.getSnapshot();

    // Processar snapshot
    const snapshotMap = new Map<string, any>();
    const maybeSnapshot: any = snapshot as any;
    const items = maybeSnapshot?.items ?? maybeSnapshot;

    if (items instanceof Map) {
      for (const [k, v] of items.entries()) snapshotMap.set(String(k).trim(), v);
    } else if (items && typeof items.entries === "function") {
      const entries = Array.from((items as any).entries()) as Array<[unknown, unknown]>;
      for (const [k, v] of entries) snapshotMap.set(String(k).trim(), v);
    } else if (items && typeof items === "object") {
      for (const [k, v] of Object.entries(items)) snapshotMap.set(String(k).trim(), v);
    }

    let insertedCount = 0;
    let outsideExpectedOmieCodeLength = 0;
    let skippedOutOfRangeDecimal = 0;

    // Processar em lotes
    const allCodes = Array.from(snapshotMap.keys());
    for (let i = 0; i < allCodes.length; i += BATCH_SIZE) {
      const batchCodes = allCodes.slice(i, i + BATCH_SIZE);
      const upsertPromises = batchCodes.map(async (omieCode) => {
        const item = snapshotMap.get(omieCode);
        if (!item) return null;

        // Validar código Omie
        if (omieCode.length !== EXPECTED_OMIE_CODE_LENGTH) {
          outsideExpectedOmieCodeLength++;
          if (outsideExpectedOmieCodeLength <= MAX_WARN_LOGS) {
            deps.logger.warn?.({ omieCode, length: omieCode.length }, "Omie code length unexpected");
          }
          return null;
        }

        // Validar valores decimais
        const stockQuantity = String(item.stockQuantity ?? "0");
        const minimumStock = String(item.minimumStock ?? "0");

        const stockParts = stockQuantity.split(".");
        const minParts = minimumStock.split(".");

        if (
          stockParts[0].length > MAX_DECIMAL_INTEGER_DIGITS ||
          minParts[0].length > MAX_DECIMAL_INTEGER_DIGITS
        ) {
          skippedOutOfRangeDecimal++;
          if (skippedOutOfRangeDecimal <= MAX_WARN_LOGS) {
            deps.logger.warn?.(
              { omieCode, stockQuantity, minimumStock },
              "Decimal integer part too long"
            );
          }
          return null;
        }

        // Upsert no banco
        await deps.productStockRepo.upsert({
          omieCode,
          stockQuantity,
          minimumStock,
          capturedAt,
        });

        return omieCode;
      });

      const results = await Promise.all(upsertPromises);
      insertedCount += results.filter(Boolean).length;
    }

    return {
      insertedCount,
      meta: {
        outsideExpectedOmieCodeLength,
        skippedOutOfRangeDecimal,
      },
    };
  } finally {
    // Liberar lock
    await deps.syncLockLeaseRepo.release(STOCK_REFRESH_LOCK_KEY);
  }
}

/**
 * Job: refresh de estoque (persistência do snapshot Omie)
 * - cron configurável
 * - flag de enable
 * - evita concorrência local (inFlight)
 * - concorrência global fica no use case (lock)
 */
export function startStockRefreshJob(
  appOrLogger: FastifyInstance | LoggerLike
) {
  const log = resolveLogger(appOrLogger);

  // ✅ flag de ativação
  const enabled =
    String(process.env.ENABLE_STOCK_REFRESH_JOB ?? "")
      .trim()
      .toLowerCase() === "true";

  if (!enabled) {
    log.info({}, "stock refresh job disabled");
    return;
  }

  // ✅ cron configurável
  const cronExpr =
    String(process.env.STOCK_REFRESH_CRON ?? "").trim() ||
    "*/30 * * * *";

  const effectiveCronExpr = cron.validate(cronExpr)
    ? cronExpr
    : "*/30 * * * *";

  if (effectiveCronExpr !== cronExpr) {
    log.warn(
      { cronExpr },
      "stock refresh job: invalid cron expr, falling back to */30 * * * *"
    );
  }

  log.info(
    { cronExpr: effectiveCronExpr },
    "stock refresh job scheduled"
  );

  let inFlight = false;

  const tick = async () => {
    if (inFlight) {
      log.warn(
        {},
        "stock refresh job skipped (previous run still in progress)"
      );
      return;
    }

    inFlight = true;
    const startedAt = Date.now();
    const startedAtIso = new Date(startedAt).toISOString();

    log.info({ startedAt: startedAtIso }, "stock refresh started");

    try {
      const app =
        "decorate" in (appOrLogger as any)
          ? (appOrLogger as FastifyInstance)
          : null;

      if (!app) {
        throw new Error(
          "Fastify instance is required to run stock refresh job"
        );
      }

      // Criar dependências diretamente sem chamar createProductsModule
      const prisma = app.prisma;
      const logger = app.log;
      const omieClient = app.omieClient;
      
      const omieStockCache = createOmieStockCache(omieClient, { logger });
      const syncLockLeaseRepo = createSyncLockLeaseRepoPrisma(prisma);
      const productStockRepo = createProductStockRepoPrisma(prisma);
      
      // Executar lógica de refresh diretamente
      const result = await refreshStockLogic({
        omieStockCache,
        syncLockLeaseRepo,
        productStockRepo,
        logger,
      });

      if (result?.meta?.skippedLocked) {
        log.warn(
          { startedAt: startedAtIso, meta: result.meta },
          "stock refresh skipped: already running"
        );
        return;
      }

      log.info(
        {
          startedAt: startedAtIso,
          finishedAt: new Date().toISOString(),
          insertedCount: result.insertedCount,
          meta: result.meta,
          durationMs: Date.now() - startedAt,
        },
        "stock refresh finished"
      );
    } catch (err: any) {
      log.error(
        { err, stack: err?.stack, startedAt: startedAtIso },
        "stock refresh failed"
      );
    } finally {
      inFlight = false;
    }
  };

  const task = cron.schedule(effectiveCronExpr, () => {
    void tick();
  });

  // ✅ permite parar o job (shutdown)
  return () => task.stop();
}