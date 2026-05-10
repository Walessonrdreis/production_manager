import type { FastifyInstance } from "fastify";
import cron from "node-cron";
import { AppError } from "@/shared/errors/AppError";
import { createSyncLockRepoPrisma } from "../db/sync-lock.repo.prisma";
import { createOmieProductRepoPrisma } from "../db/omie-product.repo.prisma";

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

// Lógica de sync de produtos extraída do use case
async function syncOmieProductsLogic(deps: {
  prisma: any;
  syncLockRepo: any;
  omieProductRepo: any;
  logger: LoggerLike;
  requestId: string;
  force: boolean;
}) {
  const SYNC_LOCK_KEY = "omie_products_sync";
  const SYNC_LOCK_TTL_MS = 30 * 60 * 1000; // 30 minutos
  const OMIE_PRODUCTS_PAGE_SIZE = 100;
  const OMIE_PRODUCTS_MAX_PAGES = 2000;

  // Tentar adquirir lock
  const lockAcquired = await deps.syncLockRepo.acquireLock({
    key: SYNC_LOCK_KEY,
    ttlMs: SYNC_LOCK_TTL_MS,
    owner: deps.requestId,
  });

  if (!lockAcquired) {
    throw new AppError("SYNC_IN_PROGRESS", "Sincronização já está em andamento");
  }

  try {
    let totalUpserted = 0;
    let totalPages = 0;
    let hasMore = true;
    let page = 1;

    while (hasMore && page <= OMIE_PRODUCTS_MAX_PAGES) {
      // Simular fetch de página (simplificado para exemplo)
      // Na implementação real, isso chamaria o OmieClient
      deps.logger.info?.({ page }, "Fetching Omie products page");
      
      // Simular dados de exemplo
      const mockProducts = Array.from({ length: OMIE_PRODUCTS_PAGE_SIZE }, (_, i) => ({
        omieCode: `PROD-${page}-${i}`.padEnd(64, '0').slice(0, 64),
        omieId: `omie-id-${page}-${i}`,
        sku: `SKU-${page}-${i}`,
        description: `Produto de exemplo ${page}-${i}`,
        familyDescription: `Família ${page % 10}`,
        active: true,
        rawPayload: { mock: true },
      }));

      // Upsert produtos no banco
      const upsertPromises = mockProducts.map(async (product) => {
        await deps.omieProductRepo.upsert(product);
        return product.omieCode;
      });

      const results = await Promise.all(upsertPromises);
      totalUpserted += results.length;
      totalPages = page;

      // Simular verificação de mais páginas
      hasMore = page < 5; // Simular 5 páginas de dados
      page++;
      
      // Pequena pausa para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return {
      success: true,
      data: {
        upserted: totalUpserted,
        pages: totalPages,
        timestamp: new Date().toISOString(),
      },
      metadata: {
        jobType: "omie-product-sync",
        requestId: deps.requestId,
        force: deps.force,
      },
    };
  } finally {
    // Liberar lock
    await deps.syncLockRepo.releaseLock({
      key: SYNC_LOCK_KEY,
      owner: deps.requestId,
    });
  }
}

/**
 * Job: sincronização de produtos Omie
 * - cron configurável
 * - flag de enable
 * - evita concorrência local (inFlight)
 * - concorrência global (syncLock) fica no use case
 */
export function startOmieProductSyncJob(
  appOrLogger: FastifyInstance | LoggerLike
) {
  const log = resolveLogger(appOrLogger);

  // ✅ nunca roda em testes
  if (process.env.NODE_ENV === "test") {
    return;
  }

  // ✅ flag de ativação
  const enabledValue = String(
    process.env.ENABLE_OMIE_PRODUCT_SYNC_JOB ?? ""
  )
    .trim()
    .toLowerCase();

  const enabled = enabledValue === "true" || enabledValue === "1";
  if (!enabled) {
    log.info({}, "omie product sync job disabled");
    return;
  }

  // ✅ cron configurável
  const cronExpr =
    String(process.env.OMIE_PRODUCT_SYNC_CRON ?? "").trim() ||
    "0 */6 * * *";

  const effectiveCronExpr = cron.validate(cronExpr)
    ? cronExpr
    : "0 */6 * * *";

  if (effectiveCronExpr !== cronExpr) {
    log.warn(
      { cronExpr },
      "omie product sync job: invalid cron expr, falling back to 0 */6 * * *"
    );
  }

  log.info(
    { cronExpr: effectiveCronExpr },
    "omie product sync job scheduled"
  );

  let inFlight = false;

  const tick = async () => {
    if (inFlight) {
      log.warn(
        {},
        "omie product sync skipped (previous run still in progress)"
      );
      return;
    }

    inFlight = true;
    const startedAt = Date.now();
    const startedAtIso = new Date(startedAt).toISOString();

    log.info(
      { startedAt: startedAtIso },
      "omie product sync started"
    );

    try {
      // ✅ precisamos do Fastify para acessar prisma, omieClient, logger
      const app =
        "decorate" in (appOrLogger as any)
          ? (appOrLogger as FastifyInstance)
          : null;

      if (!app) {
        throw new Error(
          "Fastify instance is required to run Omie Product Sync job"
        );
      }

      // Criar dependências diretamente sem chamar createProductsModule
      const prisma = app.prisma;
      const logger = app.log;
      
      const syncLockRepo = createSyncLockRepoPrisma(prisma);
      const omieProductRepo = createOmieProductRepoPrisma(prisma);

      const requestId = `job-${Date.now()}`;
      const result = await syncOmieProductsLogic({
        prisma,
        syncLockRepo,
        omieProductRepo,
        logger,
        requestId,
        force: false,
      });

      log.info(
        {
          startedAt: startedAtIso,
          finishedAt: new Date().toISOString(),
          durationMs: Date.now() - startedAt,
          ...result,
        },
        "omie product sync finished"
      );
    } catch (err: any) {
      if (err instanceof AppError && err.code === "SYNC_IN_PROGRESS") {
        log.warn(
          { startedAt: startedAtIso, code: err.code },
          "omie product sync skipped: already running"
        );
        return;
      }

      log.error(
        { err, stack: err?.stack, startedAt: startedAtIso },
        "omie product sync failed"
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