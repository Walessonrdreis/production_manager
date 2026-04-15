"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startStockRefreshJob = startStockRefreshJob;
const node_cron_1 = __importDefault(require("node-cron"));
const stockRefresh_service_1 = require("../services/stockRefresh.service");
function resolveLogger(input) {
    const maybeFastify = input;
    const maybeLogger = input;
    if (maybeFastify && typeof maybeFastify.log?.info === 'function') {
        return maybeFastify.log;
    }
    return maybeLogger;
}
function startStockRefreshJob(appOrLogger) {
    const log = resolveLogger(appOrLogger);
    const enabled = String(process.env.ENABLE_STOCK_REFRESH_JOB ?? '').trim().toLowerCase() === 'true';
    if (!enabled) {
        return;
    }
    const cronExpr = String(process.env.STOCK_REFRESH_CRON ?? '').trim() || '*/30 * * * *';
    const effectiveCronExpr = node_cron_1.default.validate(cronExpr) ? cronExpr : '*/30 * * * *';
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
    const task = node_cron_1.default.schedule(effectiveCronExpr, () => {
        void tick();
    });
    return () => task.stop();
}
