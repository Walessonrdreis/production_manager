import type { FastifyInstance } from "fastify";
import { env } from "@/config";
import { prisma } from "@/shared/db/prisma";
import { getLogger } from "@/shared/logger";
import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";

import { SyncAllSalesOrdersRequestSchema } from "../../schemas";
import { SyncAllSalesOrdersUseCase } from "../../../../application/use-cases/sync-all-sales-orders.usecase";
import { SalesOrderSyncIntegrationStore } from "../../../../infrastructure/db/sales-order-sync-integration.store";
import { SalesOrderSyncCommandStore } from "../../../../infrastructure/db/sales-order-sync-command.store";
import { PrismaSyncStateStore } from "@/shared/integration/strategies/sync-state.store";
import { FakeSalesOrderFetchPageGateway } from "../../../../infrastructure/gateways/fetch-page/fake-sales-order-fetch-page.gateway";
import { RealSalesOrderFetchPageGateway } from "../../../../infrastructure/gateways/fetch-page/real-sales-order-fetch-page.gateway";

// ✅ imports do product-catalog (NOVO)
import { ProductCatalogProductionReadyReadModelStore } from "@/modules/integration/product-catalog/infrastructure/db/product-catalog-production-ready-read-model.store";
import { RefreshProductCatalogProductionReadyUseCase } from "@/modules/integration/product-catalog/application/use-cases/refresh-product-catalog-production-ready.usecase";

// ✅ imports do sales-order-summary (NOVO)
import { SalesOrderSummaryReadModelStore } from "../../../../infrastructure/db/sales-order-summary-read-model.store";
import { SalesOrderStageTransitionStore } from "../../../../infrastructure/db/sales-order-stage-transition.store";
import { RefreshSalesOrderSummaryReadModelUseCase } from "../../../../application/use-cases/refresh-sales-order-summary-read-model.usecase";

const logger = getLogger("sync-all-sales-orders.route");

export async function registerSyncAllSalesOrdersRoute(
  app: FastifyInstance
) {
  app.post(
    "/v1/integration/sales-order-sync/commands/sync-global",
    async (request, reply) => {
      // ✅ Validação via schema Zod — externalRequestId é obrigatório
      const parsed = SyncAllSalesOrdersRequestSchema.parse(request.body);
      const { externalRequestId, pageSize, maxPages } = parsed;

      const omieClient = (app as any).omieClient as
        | OmieHttpClientPort
        | undefined;

      if (!omieClient && env.SALES_ORDER_SYNC_GATEWAY === "real") {
        logger.error("omieClient not available on Fastify app instance", {
          externalRequestId,
        });

        return reply.code(500).send({
          success: false,
          error: {
            code: "OMIE_CLIENT_NOT_AVAILABLE",
            message:
              "omieClient não foi encontrado no app. Verifique o bootstrap.",
          },
        });
      }

      const fetchPageGateway =
        env.SALES_ORDER_SYNC_GATEWAY === "real"
          ? new RealSalesOrderFetchPageGateway(
            omieClient as OmieHttpClientPort
          )
          : new FakeSalesOrderFetchPageGateway();

      // ✅ instancia o refresh do product-catalog (NOVO)
      const refreshProductCatalogUseCase =
        new RefreshProductCatalogProductionReadyUseCase(
          new ProductCatalogProductionReadyReadModelStore()
        );

      // ✅ instancia o refresh do sales-order-summary (NOVO)
      const refreshSalesOrderSummaryUseCase =
        new RefreshSalesOrderSummaryReadModelUseCase(
          new SalesOrderSummaryReadModelStore(),
          new SalesOrderStageTransitionStore()
        );

      // ✅ usecase completo com ordem correta de parâmetros
      const syncStateStore = new PrismaSyncStateStore(prisma.salesOrderSyncState, "GLOBAL");
      const useCase = new SyncAllSalesOrdersUseCase(
        fetchPageGateway,
        new SalesOrderSyncIntegrationStore(prisma),
        new SalesOrderSyncCommandStore(prisma),
        syncStateStore,
        refreshProductCatalogUseCase, // ✅ product-catalog
        refreshSalesOrderSummaryUseCase, // ✅ sales-order-summary
        {
          noWrite: env.SALES_ORDER_SYNC_GATEWAY === "fake",
        }
      );

      // ✅ Capturar lastSyncAt antes da execução
      const { lastSyncAt } = await syncStateStore.getState();

      logger.info("Triggering sales-order global sync", {
        externalRequestId,
        gatewayMode: env.SALES_ORDER_SYNC_GATEWAY,
        pageSize: pageSize ?? 100,
        maxPages: maxPages ?? 1000,
        lastSyncAt,
      });

      void useCase
        .execute({
          externalRequestId,
          pageSize,
          maxPages,
          source: "API2",
        })
        .then((result) => {
          logger.info("Sales-order global sync finished", {
            externalRequestId,
            result,
          });
        })
        .catch((error) => {
          logger.error("Sales-order global sync failed", {
            externalRequestId,
            error,
          });
        });

      return reply.code(202).send({
        success: true,
        data: {
          status: "ACCEPTED",
          externalRequestId,
          resourceId: "__GLOBAL__",
          lastSyncAt,
        },
      });
    }
  );

}