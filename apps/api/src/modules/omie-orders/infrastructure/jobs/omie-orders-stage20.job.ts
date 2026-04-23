import type { FastifyInstance } from "fastify";
import cron from "node-cron";
import { AppError } from "@/shared/errors/AppError";
import { createOmieOrdersModule } from "@/modules/omie-orders";

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
 * Job: sincroniza pedidos Omie etapa 20
 * - cron configurável por env
 * - flag de enable
 * - evita concorrência local (inFlight)
 * - concorrência global garantida pelo JobLock no use case
 */
export function startOmieOrdersStage20SyncJob(
  appOrLogger: FastifyInstance | LoggerLike
) {
  const log = resolveLogger(appOrLogger);

  // ✅ nunca roda em testes
  if (process.env.NODE_ENV === "test") {
    return;
  }

  // ✅ flag de ativação
  const enabledValue = String(
    process.env.ENABLE_OMIE_ORDERS_STAGE20_SYNC ?? ""
  )
    .trim()
    .toLowerCase();

  const enabled = enabledValue === "true" || enabledValue === "1";
  if (!enabled) {
    log.info({}, "omie orders stage20 sync job disabled");
    return;
  }

  // ✅ cron configurável
  const cronExpr =
    String(process.env.OMIE_ORDERS_STAGE20_CRON ?? "").trim() ||
    "*/10 * * * *";

  const effectiveCronExpr = cron.validate(cronExpr)
    ? cronExpr
    : "*/10 * * * *";

  if (effectiveCronExpr !== cronExpr) {
    log.warn(
      { cronExpr },
      "omie orders stage20 sync job: invalid cron expr, falling back to */10 * * * *"
    );
  }

  log.info(
    { cronExpr: effectiveCronExpr },
    "omie orders stage20 sync job scheduled"
  );

  let inFlight = false;

  const tick = async () => {
    if (inFlight) {
      log.warn(
        {},
        "omie orders stage20 sync skipped (previous run still in progress)"
      );
      return;
    }

    inFlight = true;
    const startedAt = Date.now();
    const startedAtIso = new Date(startedAt).toISOString();

    log.info(
      { startedAt: startedAtIso },
      "omie orders stage20 sync started"
    );

    try {
      // ✅ cria módulo e chama use case
      const app =
        "decorate" in (appOrLogger as any)
          ? (appOrLogger as FastifyInstance)
          : null;

      if (!app) {
        throw new Error(
          "Fastify instance is required to run Omie Orders Stage20 job"
        );
      }

      const { useCases } = createOmieOrdersModule(app);

      const result = await useCases.syncStage20Orders.execute();

      log.info(
        {
          startedAt: startedAtIso,
          finishedAt: new Date().toISOString(),
          durationMs: Date.now() - startedAt,
          ...result,
        },
        "omie orders stage20 sync finished"
      );
    } catch (err: any) {
      if (err instanceof AppError && err.code === "SYNC_IN_PROGRESS") {
        log.warn(
          { startedAt: startedAtIso, code: err.code },
          "omie orders stage20 sync skipped: already running"
        );
        return;
      }

      log.error(
        { err, stack: err?.stack, startedAt: startedAtIso },
        "omie orders stage20 sync failed"
      );
    } finally {
      inFlight = false;
    }
  };

  const task = cron.schedule(effectiveCronExpr, () => {
    void tick();
  });

  // ✅ permite parar o job (ex.: shutdown)
  return () => task.stop();
}