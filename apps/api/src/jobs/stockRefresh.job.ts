import type { FastifyInstance } from 'fastify';
import cron from 'node-cron';
import { runStockRefresh } from '../services/stockRefresh.service';

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

export function startStockRefreshJob(appOrLogger: FastifyInstance | LoggerLike) {
  const log = resolveLogger(appOrLogger);

  const enabled = String(process.env.ENABLE_STOCK_REFRESH_JOB ?? '').trim().toLowerCase() === 'true';
  if (!enabled) {
    return;
  }

  const cronExpr = String(process.env.STOCK_REFRESH_CRON ?? '').trim() || '*/30 * * * *';
  const effectiveCronExpr = cron.validate(cronExpr) ? cronExpr : '*/30 * * * *';

  if (effectiveCronExpr !== cronExpr) {
    log.warn({ cronExpr }, 'stock refresh job: invalid cron expr, falling back to */30 * * * *');
  }

  log.info({ cronExpr: effectiveCronExpr }, 'stock refresh job scheduled');

  let inFlight = false;

  const tick = async () => {
    if (inFlight) {
      log.warn({}, 'stock refresh job skipped (previous run still in progress)');
      return;
    }

    inFlight = true;
    const startedAt = Date.now();
    const startedAtIso = new Date(startedAt).toISOString();

    log.info({ startedAt: startedAtIso }, 'stock refresh started');

    try {
      const result = await runStockRefresh();

      if (result.meta?.skippedLocked) {
        log.warn({ startedAt: startedAtIso, meta: result.meta }, 'skipped: already running');
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
        'stock refresh finished'
      );
    } catch (err: any) {
      log.error({ err, stack: err?.stack, startedAt: startedAtIso }, 'stock refresh failed');
    } finally {
      inFlight = false;
    }
  };

  const task = cron.schedule(effectiveCronExpr, () => {
    void tick();
  });

  return () => task.stop();
}
