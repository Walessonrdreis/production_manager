import type { FastifyInstance } from "fastify";
import cron from "node-cron";
import { AppError } from "@/shared/errors/AppError";
import { createProductsModule } from "@/modules/products";

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

      // ✅ monta módulo e executa use case
      const { useCases } = createProductsModule(app);

      const requestId = `job-${Date.now()}`;
      const result = await useCases.syncOmieProducts.execute({
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
