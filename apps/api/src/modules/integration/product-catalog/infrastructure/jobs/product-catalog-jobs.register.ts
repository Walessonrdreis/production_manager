import cron from "node-cron";
import { env } from "@/config";
import { getLogger } from "@/shared/logger";
import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";

import { SyncAllProductCatalogUseCase } from "../../application/use-cases/sync-all-product-catalog.usecase";
import { ProductCatalogIntegrationStore } from "../db/product-catalog-integration.store";
import { ProductCatalogCommandStore } from "../db/product-catalog-command.store";
import { prisma } from "@/shared/db/prisma";
import { PrismaSyncStateStore } from "@/shared/integration/strategies/sync-state.store";
import { FakeProductCatalogFetchPageGateway } from "../gateways/fetch-page/fake-product-catalog-fetch-page.gateway";
import { RealProductCatalogFetchPageGateway } from "../gateways/fetch-page/real-product-catalog-fetch-page.gateway";
import { RefreshProductCatalogProductionReadyJob } from "./refresh-product-catalog-production-ready.job";

export function registerProductCatalogJobs(omieClient: OmieHttpClientPort) {
  const logger = getLogger("product-catalog:cron");

  if (env.ENABLE_OMIE_PRODUCT_CATALOG_SYNC_JOB) {
    const syncSchedule = env.OMIE_PRODUCT_CATALOG_SYNC_CRON ?? "0 */6 * * *";

    cron.schedule(syncSchedule, async () => {
      const runLogger = getLogger("product-catalog:cron:sync");

      try {
        const fetchPageGateway =
          env.PRODUCT_CATALOG_GATEWAY === "real"
            ? new RealProductCatalogFetchPageGateway(omieClient)
            : new FakeProductCatalogFetchPageGateway();

        const useCase = new SyncAllProductCatalogUseCase(
          fetchPageGateway,
          new ProductCatalogIntegrationStore(),
          new ProductCatalogCommandStore(),
          new PrismaSyncStateStore(prisma.productCatalogSyncState, "global"),
          {
            noWrite: env.PRODUCT_CATALOG_GATEWAY === "fake",
          }
        );

        await useCase.execute({
          externalRequestId: `product-catalog-job-${Date.now()}`,
          pageSize: 100,
          maxPages: 1000,
          source: "JOB",
        });

        runLogger.info("Global product-catalog sync completed");
      } catch (error) {
        runLogger.error("Global product-catalog sync failed", error as any);
      }
    });
  } else {
    logger.info("Product Catalog sync job is disabled");
  }

  if (env.ENABLE_OMIE_PRODUCT_CATALOG_PRODUCTION_READY_REFRESH_JOB) {
    const refreshSchedule =
      env.OMIE_PRODUCT_CATALOG_PRODUCTION_READY_REFRESH_CRON ??
      "30 */10 * * * *";

    cron.schedule(refreshSchedule, async () => {
      const runLogger = getLogger("product-catalog:cron:production-ready");

      try {
        const job = new RefreshProductCatalogProductionReadyJob();
        await job.execute();

        runLogger.info("Production-ready read-model refresh completed");
      } catch (error) {
        runLogger.error(
          "Production-ready read-model refresh failed",
          error as any
        );
      }
    });
  } else {
    logger.info("Production-ready refresh job is disabled");
  }
}