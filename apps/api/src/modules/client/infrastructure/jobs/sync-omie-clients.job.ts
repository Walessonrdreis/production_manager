// File: apps/api/src/modules/client/infrastructure/jobs/omie-client-sync.job.ts// File: apps/api/src/modules/client/infrastructure/jobsimport type { FastifyInstance } from "fastify";
import cron from "node-cron";
import { AppError } from "@/shared/errors/AppError";
import { FastifyInstance } from "fastify";


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

function isOmieRedundantSample(sample: unknown): boolean {
  if (typeof sample !== "string") return false;
  return sample.includes("REDUNDANT") || sample.includes("Consumo redundante");
}

/**
 * Job: sync Omie Clients -> local DB
 * - cron configurável por env
 * - flag de enable
 * - evita concorrência local (inFlight)
 * - evita concorrência local via app.clientSyncState (se existir)
 */
export function startOmieClientSyncJob(appOrLogger: FastifyInstance | LoggerLike) {
  const log = resolveLogger(appOrLogger);

  // ✅ nunca roda em testes
  if (process.env.NODE_ENV === "test") {
    return;
  }

  // ✅ flag de ativação
  const enabledValue = String(process.env.ENABLE_OMIE_CLIENT_SYNC_JOB ?? "")
    .trim()
    .toLowerCase();

  const enabled = enabledValue === "true" || enabledValue === "1";
  if (!enabled) {
    log.info({}, "omie client sync job disabled");
    return;
  }

  // ✅ cron configurável
  const cronExpr =
    String(process.env.OMIE_CLIENT_SYNC_CRON ?? "").trim() || "*/10 * * * *";

  const effectiveCronExpr = cron.validate(cronExpr) ? cronExpr : "*/10 * * * *";

  if (effectiveCronExpr !== cronExpr) {
    log.warn(
      { cronExpr },
      "omie client sync job: invalid cron expr, falling back to */10 * * * *"
    );
  }

  log.info({ cronExpr: effectiveCronExpr }, "omie client sync job scheduled");

  // ✅ evita duplicar agendamento caso alguém chame duas vezes
  const app =
    "decorate" in (appOrLogger as any) ? (appOrLogger as FastifyInstance) : null;

  if (app && typeof (app as any).omieClientSyncJobStop === "function") {
    log.warn({}, "omie client sync job already scheduled; skipping duplicate schedule");
    return (app as any).omieClientSyncJobStop as () => void;
  }

  let inFlight = false;

  const tick = async () => {
    if (inFlight) {
      log.warn({}, "omie client sync skipped (previous run still in progress)");
      return;
    }

    inFlight = true;
    const startedAt = Date.now();
    const startedAtIso = new Date(startedAt).toISOString();

    log.info({ startedAt: startedAtIso }, "omie client sync started");

    try {
      if (!app) {
        throw new Error("Fastify instance is required to run Omie Client sync job");
      }

      // ✅ lock local do app (se você decorou clientSyncState)
      const state = (app as any).clientSyncState as
        | { running: boolean; lastStartedAt: Date | null; lastFinishedAt: Date | null }
        | undefined;

      if (state?.running) {
        log.warn({ startedAt: startedAtIso }, "omie client sync skipped: already running (state)");
        return;
      }

      if (state) {
        state.running = true;
        state.lastStartedAt = new Date();
      }

      await app.syncOmieClientsUseCase.execute();

      if (state) state.lastFinishedAt = new Date();

      log.info(
        {
          startedAt: startedAtIso,
          finishedAt: new Date().toISOString(),
          durationMs: Date.now() - startedAt,
        },
        "omie client sync finished"
      );
    } catch (err: any) {
      // ✅ Tratamentos esperados
      if (err instanceof AppError) {
        // se você usar um code específico futuramente, já fica pronto:
        if (err.code === "SYNC_IN_PROGRESS") {
          log.warn(
            { startedAt: startedAtIso, code: err.code },
            "omie client sync skipped: already running"
          );
          return;
        }

        // REDUNDANT da Omie (vem no sample)
        const sample = (err as any)?.details?.sample;
        if (isOmieRedundantSample(sample)) {
          log.warn(
            { startedAt: startedAtIso, code: err.code },
            "omie client sync skipped: redundant consumption (Omie REDUNDANT)"
          );
          return;
        }
      }

      log.error(
        { err, stack: err?.stack, startedAt: startedAtIso },
        "omie client sync failed"
      );
    } finally {
      // libera lock state
      if (app) {
        const state = (app as any).clientSyncState as any;
        if (state && state.running) state.running = false;
      }

      inFlight = false;
    }
  };

  const task = cron.schedule(effectiveCronExpr, () => {
    void tick();
  }, { timezone: "America/Sao_Paulo" });

  const stop = () => task.stop();

  // ✅ expõe stop no app (evita duplicação e ajuda no shutdown)
  if (app) {
    (app as any).decorate?.("omieClientSyncJobStop", stop);
  }

  return stop;
}

