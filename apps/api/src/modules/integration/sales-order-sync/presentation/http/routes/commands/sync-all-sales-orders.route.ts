import type { FastifyInstance } from "fastify";
import { env } from "@/config";
import { prisma } from "@/shared/db/prisma";
import { getLogger } from "@/shared/logger";
import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";

import { SyncAllSalesOrdersUseCase } from "../../../../application/use-cases/sync-all-sales-orders.usecase";
import { SalesOrderSyncIntegrationStore } from "../../../../infrastructure/db/sales-order-sync-integration.store";
import { SalesOrderSyncCommandStore } from "../../../../infrastructure/db/sales-order-sync-command.store";
import { SalesOrderSyncStateStore } from "../../../../infrastructure/db/sales-order-sync-state.store";
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

type SyncAllSalesOrdersRequestDTO = {
  externalRequestId?: string;
  pageSize?: number;
  maxPages?: number;
};

function buildExternalRequestId() {
  return `sales-order-sync-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export async function registerSyncAllSalesOrdersRoute(
  app: FastifyInstance
) {
  app.post(
    "/v1/integration/sales-order-sync/sync-global",
    async (request, reply) => {
      const body =
        (request.body as SyncAllSalesOrdersRequestDTO | undefined) ?? {};

      const externalRequestId =
        body.externalRequestId ?? buildExternalRequestId();

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
      const useCase = new SyncAllSalesOrdersUseCase(
        fetchPageGateway,
        new SalesOrderSyncIntegrationStore(prisma),
        new SalesOrderSyncCommandStore(prisma),
        new SalesOrderSyncStateStore(),
        refreshProductCatalogUseCase, // ✅ product-catalog
        refreshSalesOrderSummaryUseCase, // ✅ sales-order-summary
        {
          noWrite: env.SALES_ORDER_SYNC_GATEWAY === "fake",
        }
      );

      logger.info("Triggering sales-order global sync", {
        externalRequestId,
        gatewayMode: env.SALES_ORDER_SYNC_GATEWAY,
        pageSize: body.pageSize ?? 100,
        maxPages: body.maxPages ?? 1000,
      });

      void useCase
        .execute({
          externalRequestId,
          pageSize: body.pageSize,
          maxPages: body.maxPages,
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
        },
      });
    }
  );
}