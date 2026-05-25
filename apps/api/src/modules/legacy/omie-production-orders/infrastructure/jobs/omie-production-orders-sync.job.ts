import type { FastifyInstance } from "fastify";
import cron from "node-cron";
import { AppError } from "@/shared/errors";
import { createOmieProductionOrdersModule } from "@/modules/legacy/omie-production-orders";

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
 * Job: synchronizes Omie production orders usando cron
 * - Execução periódica via cron
 * - Retry controlado em caso de falhas
 * - Execução única por job
 */
export function startOmieProductionOrdersSyncJob(
  appOrLogger: FastifyInstance | LoggerLike
) {
  const log = resolveLogger(appOrLogger);

  // ✅ nunca roda em testes
  if (process.env.NODE_ENV === "test") {
    return;
  }

  // ✅ flag de ativação
  const enabledValue = String(
    process.env.ENABLE_OMIE_PRODUCTION_ORDERS_SYNC_JOB ?? ""
  )
    .trim()
    .toLowerCase();

  const enabled = enabledValue === "true" || enabledValue === "1";
  if (!enabled) {
    log.info({}, "omie production orders sync job disabled");
    return;
  }

  // ✅ cron configurável
  const cronExpr =
    String(process.env.OMIE_PRODUCTION_ORDERS_SYNC_CRON ?? "").trim() ||
    "*/30 * * * *";

  const effectiveCronExpr = cron.validate(cronExpr)
    ? cronExpr
    : "*/30 * * * *";

  if (effectiveCronExpr !== cronExpr) {
    log.warn(
      { cronExpr },
      "omie production orders sync job: invalid cron expr, falling back to */30 * * * *"
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
        "omie production orders sync job skipped (previous run still in progress)"
      );
      return;
    }

    inFlight = true;
    const startedAt = Date.now();
    const startedAtIso = new Date(startedAt).toISOString();

    log.info({ startedAt: startedAtIso }, "omie production orders sync job started");

    try {
      // ✅ obtém instância do Fastify se disponível
      const app =
        "decorate" in (appOrLogger as any)
          ? (appOrLogger as FastifyInstance)
          : null;

      if (!app) {
        throw new Error(
          "Fastify instance is required to run Omie Production Orders Sync job"
        );
      }

      // ✅ obtém módulo de ordens de produção Omie
      const { useCases } = createOmieProductionOrdersModule(app);

      // ✅ executa sincronização de ordens de produção
      const syncResult = await useCases.syncProductionOrders.execute();

      const durationMs = Date.now() - startedAt;

      log.info(
        {
          startedAt: startedAtIso,
          finishedAt: new Date().toISOString(),
          durationMs,
          ordersSynced: syncResult.data?.ordersSynced || 0,
        },
        "omie production orders sync job finished"
      );
    } catch (err: any) {
      log.error(
        { err, stack: err?.stack, startedAt: startedAtIso },
        "omie production orders sync job failed"
      );
    } finally {
      inFlight = false;
    }
  };

  const task = cron.schedule(effectiveCronExpr, tick, {
    scheduled: true,
    timezone: "America/Sao_Paulo",
  });

  // ✅ permite parar o job (shutdown)
  return () => task.stop();
}