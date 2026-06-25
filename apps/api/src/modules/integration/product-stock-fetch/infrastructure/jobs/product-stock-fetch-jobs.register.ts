// ---------------------------------------------------------------------------
// Jobs Register: product-stock-fetch-jobs.register.ts
// Registra os jobs agendados (cron) para sync incremental de estoque.
// ---------------------------------------------------------------------------

import cron from "node-cron";
import { env } from "@/config";
import { getLogger } from "@/shared/logger";
import { randomUUID } from "crypto";
import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";

import { SyncAllProductStockUseCase } from "../../application/use-cases/sync-all-product-stock.usecase";
import { ProductStockIntegrationStore } from "../db/product-stock-integration.store";
import { ProductStockCommandStore } from "../db/product-stock-command.store";
import { prisma } from "@/shared/db/prisma";
import { PrismaSyncStateStore } from "@/shared/integration/strategies/sync-state.store";
import { FakeProductStockIntegrationStore } from "../db/fake-product-stock-integration.store";
import { FakeProductStockCommandStore } from "../db/fake-product-stock-command.store";
import { RealProductStockFetchPageGateway } from "../gateways/product-stock-fetch/real-product-stock-fetch-page.gateway";
import { FakeProductStockFetchPageGateway } from "../gateways/product-stock-fetch/fake-product-stock-fetch-page.gateway";

import { ProductCatalogProductionReadyReadModelStore } from "@/modules/integration/product-catalog/infrastructure/db/product-catalog-production-ready-read-model.store";
import { RefreshProductCatalogProductionReadyUseCase } from "@/modules/integration/product-catalog/application/use-cases/refresh-product-catalog-production-ready.usecase";

import { enqueueJob } from "@/shared/infra/job-queue";

function buildUseCase(omieClient: OmieHttpClientPort) {
  const useFake = env.PRODUCT_STOCK_FETCH_GATEWAY === "fake";

  const fetchPageGateway = useFake
    ? new FakeProductStockFetchPageGateway()
    : new RealProductStockFetchPageGateway(omieClient);

  const integrationStore = useFake
    ? new FakeProductStockIntegrationStore()
    : new ProductStockIntegrationStore();

  const commandStore = useFake
    ? new FakeProductStockCommandStore()
    : new ProductStockCommandStore();

  const syncStateStore = new PrismaSyncStateStore(prisma.productStockFetchSyncState, "global");

  const refreshProductCatalogUseCase =
    new RefreshProductCatalogProductionReadyUseCase(
      new ProductCatalogProductionReadyReadModelStore()
    );

  return new SyncAllProductStockUseCase(
    fetchPageGateway,
    integrationStore,
    commandStore,
    syncStateStore,
    refreshProductCatalogUseCase,
    { noWrite: useFake },
  );
}

export function registerProductStockFetchJobs(omieClient: OmieHttpClientPort) {
  const logger = getLogger("product-stock-fetch:cron");

  if (env.ENABLE_OMIE_PRODUCT_STOCK_FETCH_REFRESH_JOB) {
    const cronExpr = env.PRODUCT_STOCK_FETCH_REFRESH_CRON ?? "*/30 * * * *";

    cron.schedule(cronExpr, async () => {
      const runLogger = getLogger("product-stock-fetch:cron:sync");

      try {
        const useCase = buildUseCase(omieClient);

        const result = await useCase.execute({
          externalRequestId: randomUUID(),
          pageSize: 100,
          source: "JOB",
        });

        runLogger.info("Product stock sync job completed", result);

        // Fase 2: após sync de estoque, enfileira refresh das OPs que têm materiais
        try {
          const refreshJobId = await enqueueJob("production-order.refresh.by-stock", {}, {
            retryLimit: 1,
            singletonKey: "production-order-refresh-by-stock",
          });
          runLogger.debug("By-stock refresh enqueued after stock sync", { jobId: refreshJobId });
        } catch (err) {
          runLogger.warn("Failed to enqueue by-stock refresh", {
            error: err instanceof Error ? err.message : String(err),
          });
        }
      } catch (error) {
        runLogger.error("Product stock sync job failed", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });

    logger.info("Product stock sync job registered", { cron: cronExpr });
  }
}
