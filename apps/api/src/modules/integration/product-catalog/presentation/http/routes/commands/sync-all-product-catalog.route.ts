import type { FastifyInstance } from "fastify";
import { env } from "@/config";
import { getLogger } from "@/shared/logger";
import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";

import type {
  SyncAllProductCatalogRequestDTO,
  SyncAllProductCatalogResponseDTO,
} from "../../../../application/dto/sync-all-product-catalog.dto";

import { SyncAllProductCatalogUseCase } from "../../../../application/use-cases/sync-all-product-catalog.usecase";
import { ProductCatalogIntegrationStore } from "../../../../infrastructure/db/product-catalog-integration.store";
import { ProductCatalogCommandStore } from "../../../../infrastructure/db/product-catalog-command.store";

import { FakeProductCatalogFetchPageGateway } from "../../../../infrastructure/gateways/fetch-page/fake-product-catalog-fetch-page.gateway";
import { RealProductCatalogFetchPageGateway } from "../../../../infrastructure/gateways/fetch-page/real-product-catalog-fetch-page.gateway";

const logger = getLogger("sync-all-product-catalog.route");

export async function registerSyncAllProductCatalogRoute(app: FastifyInstance) {
  app.post("/v1/integration/product-catalog/sync-global", async (request, reply) => {
    const body = (request.body as SyncAllProductCatalogRequestDTO | undefined) ?? {};

    const externalRequestId =
      body.externalRequestId ?? `product-catalog-global-${Date.now()}`;

    const omieClient = (app as any).omieClient as OmieHttpClientPort;

    const fetchPageGateway =
      env.PRODUCT_CATALOG_GATEWAY === "real"
        ? new RealProductCatalogFetchPageGateway(omieClient)
        : new FakeProductCatalogFetchPageGateway();

    const useCase = new SyncAllProductCatalogUseCase(
      fetchPageGateway,
      new ProductCatalogIntegrationStore(),
      new ProductCatalogCommandStore(),
      {
        noWrite: env.PRODUCT_CATALOG_GATEWAY === "fake",
      }
    );

    void useCase
      .execute({
        externalRequestId,
        pageSize: body.pageSize,
        maxPages: body.maxPages,
        source: "API2",
      })
      .catch((error) => {
        logger.error("Sync global failed", error as any);
      });

    const response: SyncAllProductCatalogResponseDTO = {
      status: "ACCEPTED",
      externalRequestId,
      resourceId: "__GLOBAL__",
    };

    return reply.code(202).send({
      success: true,
      data: response,
    });
  });
}