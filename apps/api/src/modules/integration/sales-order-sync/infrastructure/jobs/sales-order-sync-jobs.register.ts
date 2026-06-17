import cron from "node-cron";
import { env } from "@/config";
import { getLogger } from "@/shared/logger";
import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";
import { SyncSalesOrdersJob } from "./sync-sales-orders.job";

export function registerSalesOrderSyncJobs(omieClient: OmieHttpClientPort) {
  const logger = getLogger("sales-order-sync:cron");

  if (!env.ENABLE_OMIE_SALES_ORDER_SYNC_JOB) {
    logger.info("Sales-order sync job is disabled", {
      envValue: env.ENABLE_OMIE_SALES_ORDER_SYNC_JOB,
    });
    return;
  }

  const schedule = env.OMIE_SALES_ORDER_SYNC_CRON ?? "0 */10 * * * *";

  cron.schedule(schedule, async () => {
    const runLogger = getLogger("sales-order-sync:cron:run");

    try {
      const job = new SyncSalesOrdersJob(omieClient);
      await job.execute();
    } catch (error) {
      runLogger.error("Sales-order sync job failed", error as any);
    }
  });

  logger.info("Sales-order sync job registered", {
    schedule,
    envValue: env.ENABLE_OMIE_SALES_ORDER_SYNC_JOB,
  });
}
``