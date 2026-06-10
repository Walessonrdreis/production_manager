import cron from "node-cron";
import { getLogger } from "@/shared/logger";
import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";

export function registerProductCatalogJobs(omieClient: OmieHttpClientPort) {
  const logger = getLogger("product-catalog:cron");

  if (process.env.ENABLE_OMIE_PRODUCT_CATALOG_SYNC_JOB !== "true") {
    logger.info("Product Catalog sync job is disabled");
    return;
  }

  const schedule = process.env.OMIE_PRODUCT_CATALOG_SYNC_CRON ?? "0 */12 * * *";

  cron.schedule(schedule, async () => {
    const runLogger = getLogger("product-catalog:cron:run");
    try {
      runLogger.info("TODO: executar job de sync do product-catalog");
    } catch (error) {
      runLogger.error("Job failed", error as any);
    }
  });

  void omieClient;
}