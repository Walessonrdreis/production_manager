"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startStockRefreshJob = startStockRefreshJob;
const stockRefresh_service_1 = require("../services/stockRefresh.service");
function resolveLogger(input) {
    const maybeFastify = input;
    const maybeLogger = input;
    if (maybeFastify && typeof maybeFastify.log?.info === 'function') {
        return maybeFastify.log;
    }
    return maybeLogger;
}
function parseCronToIntervalMs(expr) {
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
function startStockRefreshJob(appOrLogger) {
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
            const result = await (0, stockRefresh_service_1.runStockRefresh)();
            if (result.meta?.skippedLocked) {
                log.warn({ startedAt: startedAtIso, meta: result.meta }, 'skipped: already running');
                return;
            }
            log.info({
                startedAt: startedAtIso,
                finishedAt: new Date().toISOString(),
                insertedCount: result.insertedCount,
                meta: result.meta,
                durationMs: Date.now() - startedAt,
            }, 'stock refresh finished');
        }
        catch (err) {
            log.error({ err, stack: err?.stack, startedAt: startedAtIso }, 'stock refresh failed');
        }
        finally {
            inFlight = false;
        }
    };
    const intervalId = setInterval(() => {
        void tick();
    }, intervalMs);
    return () => clearInterval(intervalId);
}
