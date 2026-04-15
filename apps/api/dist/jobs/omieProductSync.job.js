"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startOmieProductSyncJob = startOmieProductSyncJob;
const node_cron_1 = __importDefault(require("node-cron"));
const omieProductSync_service_1 = require("../services/omieProductSync.service");
const AppError_1 = require("../core/errors/AppError");
function resolveLogger(input) {
    const maybeFastify = input;
    const maybeLogger = input;
    if (maybeFastify && typeof maybeFastify.log?.info === 'function') {
        return maybeFastify.log;
    }
    return maybeLogger;
}
function startOmieProductSyncJob(appOrLogger) {
    const log = resolveLogger(appOrLogger);
    if (process.env.NODE_ENV === 'test') {
        return;
    }
    const enabledValue = String(process.env.ENABLE_OMIE_PRODUCT_SYNC_JOB ?? '').trim().toLowerCase();
    const enabled = enabledValue === 'true' || enabledValue === '1';
    if (!enabled) {
        return;
    }
    const cronExpr = String(process.env.OMIE_PRODUCT_SYNC_CRON ?? '').trim() || '0 */6 * * *';
    const effectiveCronExpr = node_cron_1.default.validate(cronExpr) ? cronExpr : '0 */6 * * *';
    if (effectiveCronExpr !== cronExpr) {
        log.warn({ cronExpr }, 'omie product sync job: invalid cron expr, falling back to 0 */6 * * *');
    }
    console.log('omie product sync job scheduled', { cronExpr: effectiveCronExpr });
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
            const result = await (0, omieProductSync_service_1.runOmieProductSync)();
            log.info({
                startedAt: startedAtIso,
                finishedAt: new Date().toISOString(),
                ...result,
                durationMs: Date.now() - startedAt,
            }, 'omie product sync finished');
        }
        catch (err) {
            if (err instanceof AppError_1.AppError && err.code === 'SYNC_IN_PROGRESS') {
                log.warn({ startedAt: startedAtIso, code: err.code }, 'omie product sync skipped: already running');
                return;
            }
            log.error({ err, stack: err?.stack, startedAt: startedAtIso }, 'omie product sync failed');
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
