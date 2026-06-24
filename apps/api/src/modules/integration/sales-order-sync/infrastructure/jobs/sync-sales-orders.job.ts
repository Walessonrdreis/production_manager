import { getLogger } from "@/shared/logger";
import { prisma } from "@/shared/db/prisma";
import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";
import { env } from "@/config";

import { FakeSalesOrderFetchPageGateway } from "../gateways/fetch-page/fake-sales-order-fetch-page.gateway";
import { RealSalesOrderFetchPageGateway } from "../gateways/fetch-page/real-sales-order-fetch-page.gateway";
import { SalesOrderSyncIntegrationStore } from "../db/sales-order-sync-integration.store";
import { SalesOrderSyncCommandStore } from "../db/sales-order-sync-command.store";
import { PrismaSyncStateStore } from "@/shared/integration/strategies/sync-state.store";
import { SyncAllSalesOrdersUseCase } from "../../application/use-cases/sync-all-sales-orders.usecase";

// ✅ imports do product-catalog (NOVO)
import { ProductCatalogProductionReadyReadModelStore } from "@/modules/integration/product-catalog/infrastructure/db/product-catalog-production-ready-read-model.store";
import { RefreshProductCatalogProductionReadyUseCase } from "@/modules/integration/product-catalog/application/use-cases/refresh-product-catalog-production-ready.usecase";

// ✅ imports do sales-order-summary
import { SalesOrderSummaryReadModelStore } from "../db/sales-order-summary-read-model.store";
import { SalesOrderStageTransitionStore } from "../db/sales-order-stage-transition.store";
import { RefreshSalesOrderSummaryReadModelUseCase } from "../../application/use-cases/refresh-sales-order-summary-read-model.usecase";

// 🔒 lock em memória (singleton no processo)
let isRunning = false;

export class SyncSalesOrdersJob {
  private readonly logger = getLogger("SyncSalesOrdersJob");

  constructor(private readonly omieClient: OmieHttpClientPort) { }

  async execute() {
    // ✅ evita execução concorrente
    if (isRunning) {
      this.logger.warn("Sales-order sync skipped: job already running");
      return;
    }

    isRunning = true;

    const externalRequestId = `sales-order-sync-job-${Date.now()}`;

    this.logger.info("Sales-order job started", {
      externalRequestId,
      gatewayMode: env.SALES_ORDER_SYNC_GATEWAY,
    });

    const fetchPageGateway =
      env.SALES_ORDER_SYNC_GATEWAY === "real"
        ? new RealSalesOrderFetchPageGateway(this.omieClient)
        : new FakeSalesOrderFetchPageGateway();

    // ✅ instancia o refresh do product-catalog (NOVO)
    const refreshProductCatalogUseCase =
      new RefreshProductCatalogProductionReadyUseCase(
        new ProductCatalogProductionReadyReadModelStore()
      );

    // ✅ instancia o refresh do sales-order-summary
    const refreshSalesOrderSummaryUseCase =
      new RefreshSalesOrderSummaryReadModelUseCase(
        new SalesOrderSummaryReadModelStore(),
        new SalesOrderStageTransitionStore()
      );

    // ✅ usecase com ordem correta dos parâmetros
    const useCase = new SyncAllSalesOrdersUseCase(
      fetchPageGateway,
      new SalesOrderSyncIntegrationStore(prisma),
      new SalesOrderSyncCommandStore(prisma),
      new PrismaSyncStateStore(prisma.salesOrderSyncState, "GLOBAL"),
      refreshProductCatalogUseCase,
      refreshSalesOrderSummaryUseCase,
      {
        noWrite: env.SALES_ORDER_SYNC_GATEWAY === "fake",
      }
    );

    const startTime = Date.now();

    try {
      const result = await useCase.execute({
        externalRequestId,
        pageSize: 100,
        maxPages: 1000,
        source: "JOB",
      });

      const durationMs = Date.now() - startTime;

      this.logger.info("Sales-order job completed", {
        externalRequestId,
        result,
        durationMs,
      });

      return result;
    } catch (error) {
      const durationMs = Date.now() - startTime;

      this.logger.error("Sales-order job failed", {
        externalRequestId,
        error,
        durationMs,
      });

      throw error;
    } finally {
      // ✅ libera lock sempre
      isRunning = false;
    }
  }
}