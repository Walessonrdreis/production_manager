// ---------------------------------------------------------------------------
// Route: POST /v1/integration/product-stock-fetch/commands/sync-global
// Inicia sincronização global de estoque (incremental).
// Retorna 202 Accepted com externalRequestId para rastreio.
// ---------------------------------------------------------------------------

import type { FastifyInstance } from "fastify";
import { env } from "@/config";
import { randomUUID } from "crypto";

import { SyncAllProductStockUseCase } from "../../../../application/use-cases/sync-all-product-stock.usecase";
import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";
import { prisma } from "@/shared/db/prisma";
import { PrismaSyncStateStore } from "@/shared/integration/strategies/sync-state.store";

import { ProductStockIntegrationStore } from "../../../../infrastructure/db/product-stock-integration.store";
import { ProductStockCommandStore } from "../../../../infrastructure/db/product-stock-command.store";

import { RealProductStockFetchPageGateway } from "../../../../infrastructure/gateways/product-stock-fetch/real-product-stock-fetch-page.gateway";
import { FakeProductStockFetchPageGateway } from "../../../../infrastructure/gateways/product-stock-fetch/fake-product-stock-fetch-page.gateway";
import { FakeProductStockIntegrationStore } from "../../../../infrastructure/db/fake-product-stock-integration.store";
import { FakeProductStockCommandStore } from "../../../../infrastructure/db/fake-product-stock-command.store";

import { ProductCatalogProductionReadyReadModelStore } from "@/modules/integration/product-catalog/infrastructure/db/product-catalog-production-ready-read-model.store";
import { RefreshProductCatalogProductionReadyUseCase } from "@/modules/integration/product-catalog/application/use-cases/refresh-product-catalog-production-ready.usecase";

type SyncAllProductStockBody = {
  externalRequestId?: string;
  pageSize?: number;
  maxPages?: number;
};

export async function registerSyncAllProductStockRoute(app: FastifyInstance) {
  app.post<{ Body: SyncAllProductStockBody }>(
    "/v1/integration/product-stock-fetch/commands/sync-global",
    async (request, reply) => {
      const externalRequestId = request.body?.externalRequestId ?? randomUUID();
      const pageSize = request.body?.pageSize ?? 100;
      const maxPages = request.body?.maxPages;

      const useFake = env.PRODUCT_STOCK_FETCH_GATEWAY === "fake";

      const omieClient = (app as any).omieClient as OmieHttpClientPort;

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

      // ✅ instancia o refresh do production-ready read model (cascade após sync)
      const refreshProductCatalogUseCase =
        new RefreshProductCatalogProductionReadyUseCase(
          new ProductCatalogProductionReadyReadModelStore()
        );

      const useCase = new SyncAllProductStockUseCase(
        fetchPageGateway,
        integrationStore,
        commandStore,
        syncStateStore,
        refreshProductCatalogUseCase,
        { noWrite: useFake }
      );

      const result = await useCase.execute({
        externalRequestId,
        pageSize,
        maxPages,
        source: "API2",
      });

      return reply.status(202).send(result);
    }
  );
}
