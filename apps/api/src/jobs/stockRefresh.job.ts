import type { FastifyInstance } from 'fastify';
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

function parseCronToIntervalMs(expr: string): { intervalMs: number; mode: 'minutes' | 'hours'; step: number } | null {
  const normalized = expr.trim().replace(/\s+/g, ' ');

  const minutesMatch = normalized.match(/^\*\/(\d+)\s+\*\s+\*\s+\*\s+\*$/);
  if (minutesMatch) {
    const step = Number(minutesMatch[1]);
    if (Number.isFinite(step) && step > 0) {
      return { intervalMs: step * 60 * 1000, mode: 'minutes', step };
    }
  }

  const hoursMatch = normalized.match(/^0\s+\*\/(\d+)\s+\*\s+\*\s+\*$/);
  if (hoursMatch) {
    const step = Number(hoursMatch[1]);
    if (Number.isFinite(step) && step > 0) {
      return { intervalMs: step * 60 * 60 * 1000, mode: 'hours', step };
    }
  }

  return null;
}

export function startStockRefreshJob(appOrLogger: FastifyInstance | LoggerLike) {
  const log = resolveLogger(appOrLogger);

  const enabled = String(process.env.ENABLE_STOCK_REFRESH_JOB ?? '').trim().toLowerCase() === 'true';
  if (!enabled) {
    return;
  }

  const cronExpr = String(process.env.STOCK_REFRESH_CRON ?? '').trim() || '*/30 * * * *';
  const parsed = parseCronToIntervalMs(cronExpr);
  const intervalMs = parsed?.intervalMs ?? 30 * 60 * 1000;

  if (!parsed) {
    log.warn({ cronExpr }, 'stock refresh job: unsupported cron expr, falling back to 30 minutes interval');
  }

  log.info({ cronExpr, intervalMs }, 'stock refresh job scheduled');

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

  const intervalId = setInterval(() => {
    void tick();
  }, intervalMs);

  return () => clearInterval(intervalId);
}
