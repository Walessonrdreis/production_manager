// ---------------------------------------------------------------------------
// Jobs Register — Production Orders
// ---------------------------------------------------------------------------
// Segue o padrão de product-structure-jobs.register.ts.
// ---------------------------------------------------------------------------

import cron from "node-cron";
import { env } from "@/config";
import { getLogger } from "@/shared/logger";
import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";
import { SyncAllProductionOrdersJob } from "./sync-all-production-orders.job";
import { registerProductionOrderJobHandlers } from "./production-order-jobs.handler";
import { ProductionOrderReadModelRefreshJob } from "./production-order-read-model-refresh.job";
import { ProductionOrderReadModelFullRefreshJob } from "./production-order-read-model-full-refresh.job";

export function registerProductionOrderJobs(omieClient: OmieHttpClientPort) {
    const logger = getLogger("production-orders:cron");

    // ─── Registra handlers PgBoss para processamento assíncrono ───────
    // Substitui o queue processor legado (process-production-order-queue.job.ts)
    registerProductionOrderJobHandlers(omieClient);

    // ─── Sync Job (espelho global) ───────────────────────────────────────

    if (!env.ENABLE_OMIE_PRODUCTION_ORDER_SYNC_JOB) {
        logger.info("Production Order sync job is disabled");
    } else {
        const schedule = env.OMIE_PRODUCTION_ORDER_SYNC_CRON ?? "*/15 * * * *";

        logger.info("Registering Production Order sync job", { schedule });

        cron.schedule(schedule, async () => {
            const runLogger = getLogger("production-orders:cron:run");
            runLogger.info("Starting Production Order sync job");

            try {
                await SyncAllProductionOrdersJob.execute({
                    source: "JOB",
                    omieClient,
                });
                runLogger.info("Finished Production Order sync job");
            } catch (error) {
                runLogger.error("Production Order sync job failed", error as any);
            }
        });
    }

    // ─── Full Daily Sync Job (full re-sync — 00:00) ─────────────────────

    if (!env.ENABLE_OMIE_PRODUCTION_ORDER_FULL_SYNC_JOB) {
        logger.info("Production Order full daily sync job is disabled");
    } else {
        const schedule = env.OMIE_PRODUCTION_ORDER_FULL_SYNC_CRON ?? "0 0 * * *";

        logger.info("Registering Production Order full daily sync job", { schedule });

        cron.schedule(schedule, async () => {
            const runLogger = getLogger("production-orders:cron:full-daily");
            runLogger.info("Starting Production Order full daily sync");

            try {
                await SyncAllProductionOrdersJob.execute({
                    source: "JOB",
                    omieClient,
                    fullSync: true,
                });
                runLogger.info("Finished Production Order full daily sync");
            } catch (error) {
                runLogger.error("Production Order full daily sync failed", error as any);
            }
        });
    }

    // ─── Read-Model Refresh Job ──────────────────────────────────────────

    if (!env.ENABLE_OMIE_PRODUCTION_ORDER_READ_MODEL_REFRESH_JOB) {
        logger.info("Production Order read-model refresh job is disabled");
    } else {
        const schedule = env.OMIE_PRODUCTION_ORDER_READ_MODEL_REFRESH_CRON ?? "*/5 * * * *";

        logger.info("Registering Production Order read-model refresh job", { schedule });

        cron.schedule(schedule, async () => {
            const runLogger = getLogger("production-orders:cron:read-model-refresh");
            runLogger.info("Starting Production Order read-model refresh job");

            try {
                const job = new ProductionOrderReadModelRefreshJob();
                await job.execute();
                runLogger.info("Finished Production Order read-model refresh job");
            } catch (error) {
                runLogger.error("Production Order read-model refresh job failed", error as any);
            }
        });
    }

    // ─── Full Refresh Job (diário — Fase 4: rede de segurança) ──────────

    if (!env.ENABLE_OMIE_PRODUCTION_ORDER_READ_MODEL_FULL_REFRESH_JOB) {
        logger.info("Production Order read-model FULL refresh job is disabled");
    } else {
        const schedule = env.OMIE_PRODUCTION_ORDER_READ_MODEL_FULL_REFRESH_CRON ?? "0 0 * * *";

        logger.info("Registering Production Order read-model FULL refresh job", { schedule });

        cron.schedule(schedule, async () => {
            const runLogger = getLogger("production-orders:cron:read-model-full-refresh");
            runLogger.info("Starting Production Order read-model FULL refresh job");

            try {
                const job = new ProductionOrderReadModelFullRefreshJob();
                await job.execute();
                runLogger.info("Finished Production Order read-model FULL refresh job");
            } catch (error) {
                runLogger.error("Production Order read-model FULL refresh job failed", error as any);
            }
        });
    }
}
