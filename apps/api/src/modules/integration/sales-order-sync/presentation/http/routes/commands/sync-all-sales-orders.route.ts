import type { FastifyInstance } from "fastify";
import { env } from "@/config";
import { prisma } from "@/shared/db/prisma";
import { getLogger } from "@/shared/logger";
import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";

import { SyncAllSalesOrdersUseCase } from "../../../../application/use-cases/sync-all-sales-orders.usecase";
import { SalesOrderSyncIntegrationStore } from "../../../../infrastructure/db/sales-order-sync-integration.store";
import { SalesOrderSyncCommandStore } from "../../../../infrastructure/db/sales-order-sync-command.store";
import { FakeSalesOrderFetchPageGateway } from "../../../../infrastructure/gateways/fetch-page/fake-sales-order-fetch-page.gateway";
import { RealSalesOrderFetchPageGateway } from "../../../../infrastructure/gateways/fetch-page/real-sales-order-fetch-page.gateway";

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

export async function registerSyncAllSalesOrdersRoute(app: FastifyInstance) {
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
          ? new RealSalesOrderFetchPageGateway(omieClient as OmieHttpClientPort)
          : new FakeSalesOrderFetchPageGateway();

      const useCase = new SyncAllSalesOrdersUseCase(
        fetchPageGateway,
        new SalesOrderSyncIntegrationStore(prisma),
        new SalesOrderSyncCommandStore(prisma),
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
