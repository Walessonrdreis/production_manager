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
import { ProcessProductionOrderQueueJob } from "./process-production-order-queue.job";

export function registerProductionOrderJobs(omieClient: OmieHttpClientPort) {
    const logger = getLogger("production-orders:cron");

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

    // ─── Queue Processor Job (fila de comandos) ──────────────────────────

    if (!env.ENABLE_OMIE_PRODUCTION_ORDER_QUEUE_JOB) {
        logger.info("Production Order queue processor job is disabled");
    } else {
        const queueSchedule = env.OMIE_PRODUCTION_ORDER_QUEUE_CRON ?? "* * * * * *";

        logger.info("Registering Production Order queue processor job", {
            schedule: queueSchedule,
        });

        cron.schedule(queueSchedule, async () => {
            const runLogger = getLogger("production-orders:queue:cron:run");
            runLogger.info("Starting Production Order queue processor job");

            try {
                await ProcessProductionOrderQueueJob.execute();
                runLogger.info("Finished Production Order queue processor job");
            } catch (error) {
                runLogger.error(
                    "Production Order queue processor job failed",
                    error as any
                );
            }
        });
    }
}
