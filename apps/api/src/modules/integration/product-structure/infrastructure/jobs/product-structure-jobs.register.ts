import cron from "node-cron";
import { env } from "@/config";
import { getLogger } from "@/shared/logger";
import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";
import { ReconcileProductStructuresJob } from "./reconcile-product-structures.job";
import { registerProductStructureJobHandlers } from "./product-structure-jobs.handler";

export function registerProductStructureJobs(omieClient: OmieHttpClientPort) {
  const logger = getLogger("product-structure:cron");

  // ─── Registra handlers PgBoss para processamento assíncrono ───────
  // Substitui o queue processor legado (process-product-structure-queue.job.ts)
  registerProductStructureJobHandlers(omieClient);

  // ─── Sync Job (espelho global via cron) ───────────────────────────

  if (!env.ENABLE_OMIE_PRODUCT_STRUCTURE_SYNC_JOB) {
    logger.info("Product Structure sync job is disabled");
  } else {
    const schedule = env.OMIE_PRODUCT_STRUCTURE_SYNC_CRON ?? "0 */12 * * *";

    logger.info("Registering Product Structure sync job", { schedule });

    cron.schedule(schedule, async () => {
      const runLogger = getLogger("product-structure:cron:run");
      runLogger.info("Starting Product Structure sync job");

      try {
        await ReconcileProductStructuresJob.execute({
          source: "JOB",
          omieClient,
        });
        runLogger.info("Finished Product Structure sync job");
      } catch (error) {
        runLogger.error("Product Structure sync job failed", error);
      }
    });
  }
}