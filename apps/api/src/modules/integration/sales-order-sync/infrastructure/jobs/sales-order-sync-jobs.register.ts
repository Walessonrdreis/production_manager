import cron from "node-cron";
import { env } from "@/config";
import { getLogger } from "@/shared/logger";
import { enqueueJob } from "@/shared/infra/job-queue";
import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";
import { registerSalesOrderSyncJobHandlers } from "./sales-order-sync-jobs.handler";

export function registerSalesOrderSyncJobs(omieClient: OmieHttpClientPort) {
  const logger = getLogger("sales-order-sync:cron");

  // ─── Registra handlers PgBoss para processamento assíncrono ───────
  registerSalesOrderSyncJobHandlers(omieClient);

  // ─── Sync Job (espelho global via cron → PgBoss) ─────────────────

  if (!env.ENABLE_OMIE_SALES_ORDER_SYNC_JOB) {
    logger.info("Sales-order sync job is disabled", {
      envValue: env.ENABLE_OMIE_SALES_ORDER_SYNC_JOB,
    });
    return;
  }

  const schedule = env.OMIE_SALES_ORDER_SYNC_CRON ?? "*/5 * * * *";

  cron.schedule(schedule, async () => {
    const runLogger = getLogger("sales-order-sync:cron:run");

    const externalRequestId = `sales-order-sync-cron-${Date.now()}`;

    runLogger.info("Enqueuing sales-order sync-global via PgBoss", {
      schedule,
      externalRequestId,
    });

    try {
      const jobId = await enqueueJob(
        "sales-order.sync-global",
        {
          externalRequestId,
          pageSize: 100,
          maxPages: 1000,
          source: "JOB",
        },
        {
          retryLimit: 3,
          retryBackoff: true,
          singletonKey: "sales-order-sync-global",
        }
      );

      if (jobId) {
        runLogger.info("Sales-order sync-global enqueued", {
          externalRequestId,
          jobId,
        });
      } else {
        runLogger.warn("Sales-order sync-global skipped (already running)", {
          externalRequestId,
        });
      }
    } catch (error) {
      runLogger.error("Failed to enqueue sales-order sync-global", {
        externalRequestId,
        error,
      });
    }
  });

  logger.info("Sales-order sync job registered", {
    schedule,
    envValue: env.ENABLE_OMIE_SALES_ORDER_SYNC_JOB,
  });
}