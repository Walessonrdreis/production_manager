import cron from "node-cron";
import { env } from "@/config";
import { getLogger } from "@/shared/logger";
import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";

import { SyncAllProductCatalogUseCase } from "../../application/use-cases/sync-all-product-catalog.usecase";
import { ProductCatalogIntegrationStore } from "../db/product-catalog-integration.store";
import { ProductCatalogCommandStore } from "../db/product-catalog-command.store";
import { FakeProductCatalogFetchPageGateway } from "../gateways/fetch-page/fake-product-catalog-fetch-page.gateway";
import { RealProductCatalogFetchPageGateway } from "../gateways/fetch-page/real-product-catalog-fetch-page.gateway";

export function registerProductCatalogJobs(omieClient: OmieHttpClientPort) {
  const logger = getLogger("product-catalog:cron");

  if (!env.ENABLE_OMIE_PRODUCT_CATALOG_SYNC_JOB) {
    logger.info("Product Catalog sync job is disabled");
    return;
  }

  const schedule = env.OMIE_PRODUCT_CATALOG_SYNC_CRON ?? "0 */6 * * *";

  cron.schedule(schedule, async () => {
    const runLogger = getLogger("product-catalog:cron:run");

    try {
      const fetchPageGateway =
        env.PRODUCT_CATALOG_GATEWAY === "real"
          ? new RealProductCatalogFetchPageGateway(omieClient)
          : new FakeProductCatalogFetchPageGateway();

      const useCase = new SyncAllProductCatalogUseCase(
        fetchPageGateway,
        new ProductCatalogIntegrationStore(),
        new ProductCatalogCommandStore()
      );

      await useCase.execute({
        externalRequestId: `product-catalog-job-${Date.now()}`,
        pageSize: 200,
        maxPages: 1000,
        source: "JOB",
      });

      runLogger.info("Global product-catalog sync completed");
    } catch (error) {
      runLogger.error("Global product-catalog sync failed", error as any);
    }
  });
}