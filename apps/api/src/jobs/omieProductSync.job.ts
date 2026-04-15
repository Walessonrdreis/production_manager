import type { FastifyInstance } from 'fastify';
import cron from 'node-cron';
import { runOmieProductSync } from '../services/omieProductSync.service';
import { AppError } from '../core/errors/AppError';

type LoggerLike = {
  info: (obj: any, msg?: string) => void;
  warn: (obj: any, msg?: string) => void;
  error: (obj: any, msg?: string) => void;
};

function resolveLogger(input: FastifyInstance | LoggerLike): LoggerLike {
  const maybeFastify = input as FastifyInstance;
  const maybeLogger = input as LoggerLike;

  if (maybeFastify && typeof (maybeFastify as any).log?.info === 'function') {
    return (maybeFastify as any).log as LoggerLike;
  }

  return maybeLogger;
}

export function startOmieProductSyncJob(appOrLogger: FastifyInstance | LoggerLike) {
  const log = resolveLogger(appOrLogger);

  const enabled = String(process.env.ENABLE_OMIE_PRODUCT_SYNC_JOB ?? '').trim().toLowerCase() === 'true';
  if (!enabled) {
    return;
  }

  const cronExpr = String(process.env.OMIE_PRODUCT_SYNC_CRON ?? '').trim() || '0 */6 * * *';
  const effectiveCronExpr = cron.validate(cronExpr) ? cronExpr : '0 */6 * * *';

  if (effectiveCronExpr !== cronExpr) {
    log.warn({ cronExpr }, 'omie product sync job: invalid cron expr, falling back to 0 */6 * * *');
  }

  log.info({ cronExpr: effectiveCronExpr }, 'omie product sync job scheduled');

  let inFlight = false;

  const tick = async () => {
    if (inFlight) {
      log.warn({}, 'omie product sync skipped (previous run still in progress)');
      return;
    }

    inFlight = true;
    const startedAt = Date.now();
    const startedAtIso = new Date(startedAt).toISOString();

    log.info({ startedAt: startedAtIso }, 'omie product sync started');

    try {
      const result = await runOmieProductSync();

      log.info(
        {
          startedAt: startedAtIso,
          finishedAt: new Date().toISOString(),
          ...result,
          durationMs: Date.now() - startedAt,
        },
        'omie product sync finished'
      );
    } catch (err: any) {
      if (err instanceof AppError && err.code === 'SYNC_IN_PROGRESS') {
        log.warn({ startedAt: startedAtIso, code: err.code }, 'omie product sync skipped: already running');
        return;
      }

      log.error({ err, stack: err?.stack, startedAt: startedAtIso }, 'omie product sync failed');
    } finally {
      inFlight = false;
    }
  };

  const task = cron.schedule(effectiveCronExpr, () => {
    void tick();
  });

  return () => task.stop();
}

