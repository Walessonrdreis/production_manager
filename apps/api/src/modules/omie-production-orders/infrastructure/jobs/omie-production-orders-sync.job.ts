import type { FastifyInstance } from "fastify";
import cron from "node-cron";
import { AppError } from "@/shared/errors/AppError";
import { createOmieProductionOrdersModule } from "@/modules/omie-production-orders";

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
 * Job: synchronizes Omie production orders
 * - configurable cron via env
 * - enable flag
 * - avoids local concurrency (inFlight)
 * - global concurrency guaranteed by JobLock in use case
 */
export function startOmieProductionOrdersSyncJob(
  appOrLogger: FastifyInstance | LoggerLike
) {
  const log = resolveLogger(appOrLogger);

  // ✅ never runs in tests
  if (process.env.NODE_ENV === "test") {
    return;
  }

  // ✅ activation flag
  const enabledValue = String(
    process.env.OMIE_PRODUCTION_ORDERS_SYNC ?? ""
  )
    .trim()
    .toLowerCase();

  const enabled = enabledValue === "true" || enabledValue === "1";
  if (!enabled) {
    log.info({}, "omie production orders sync job disabled");
    return;
  }

  // ✅ configurable cron
  const cronExpr =
    String(process.env.OMIE_PRODUCTION_ORDERS_CRON ?? "").trim() ||
    "*/15 * * * *";

  const effectiveCronExpr = cron.validate(cronExpr)
    ? cronExpr
    : "*/15 * * * *";

  if (effectiveCronExpr !== cronExpr) {
    log.warn(
      { cronExpr },
      "omie production orders sync job: invalid cron expr, falling back to */15 * * * *"
    );
  }

  log.info(
    { cronExpr: effectiveCronExpr },
    "omie production orders sync job scheduled"
  );

  let inFlight = false;

  const tick = async () => {
    if (inFlight) {
      log.warn(
        {},
        "omie production orders sync skipped (previous run still in progress)"
      );
      return;
    }

    inFlight = true;
    const startedAt = Date.now();
    const startedAtIso = new Date(startedAt).toISOString();

    log.info(
      { startedAt: startedAtIso },
      "omie production orders sync started"
    );

    try {
      // ✅ creates module and calls use case
      const app =
        "decorate" in (appOrLogger as any)
          ? (appOrLogger as FastifyInstance)
          : null;

      if (!app) {
        throw new Error(
          "Fastify instance is required to run Omie Production Orders job"
        );
      }

      const { useCases } = createOmieProductionOrdersModule(app);

      const result = await useCases.syncProductionOrders.execute();

      log.info(
        {
          startedAt: startedAtIso,
          finishedAt: new Date().toISOString(),
          durationMs: Date.now() - startedAt,
          ...result,
        },
        "omie production orders sync finished"
      );
    } catch (err: any) {
      if (err instanceof AppError && err.code === "SYNC_IN_PROGRESS") {
        log.warn(
          { startedAt: startedAtIso, code: err.code },
          "omie production orders sync skipped: already running"
        );
        return;
      }

      log.error(
        {
          startedAt: startedAtIso,
          error: err.message,
          stack: err.stack,
        },
        "omie production orders sync failed"
      );
    } finally {
      inFlight = false;
    }
  };

  // ✅ schedule the job
  cron.schedule(effectiveCronExpr, tick, {
    scheduled: true,
    timezone: "America/Sao_Paulo",
  });
}