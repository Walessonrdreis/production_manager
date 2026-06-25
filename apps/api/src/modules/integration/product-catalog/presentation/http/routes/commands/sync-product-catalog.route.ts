import type { FastifyInstance } from "fastify";
import { env } from "@/config";
import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";

import { ProductCatalogIntegrationStore } from "../../../../infrastructure/db/product-catalog-integration.store";
import { ProductCatalogCommandStore } from "../../../../infrastructure/db/product-catalog-command.store";
import { SyncProductCatalogUseCase } from "../../../../application/use-cases/sync-product-catalog.usecase";

import { FakeProductCatalogFetchGateway } from "../../../../infrastructure/gateways/fetch/fake-product-catalog-fetch.gateway";
import { RealProductCatalogFetchGateway } from "../../../../infrastructure/gateways/fetch/real-product-catalog-fetch.gateway";

import type {
  SyncProductCatalogRequestDTO,
  SyncProductCatalogResponseDTO,
} from "../../../../application/dto/sync-product-catalog.dto";

export async function registerSyncProductCatalogRoute(app: FastifyInstance) {
  app.post("/v1/integration/product-catalog/commands/sync", async (request, reply) => {
    const { externalRequestId, productCode } = request.body as SyncProductCatalogRequestDTO;

    const omieClient = (app as any).omieClient as OmieHttpClientPort;

    const fetchGateway =
      env.PRODUCT_CATALOG_GATEWAY === "real"
        ? new RealProductCatalogFetchGateway(omieClient)
        : new FakeProductCatalogFetchGateway();

    const useCase = new SyncProductCatalogUseCase(
      fetchGateway,
      new ProductCatalogIntegrationStore(),
      new ProductCatalogCommandStore(),
      {
        noWrite: env.PRODUCT_CATALOG_GATEWAY === "fake",
      }
    );

    const result = await useCase.execute({
      externalRequestId,
      productCode,
      source: "API2",
    });

    const response: SyncProductCatalogResponseDTO = {
      status: "ACCEPTED",
      externalRequestId: result.externalRequestId,
      productCode: result.productCode,
    };

    return reply.code(202).send({
      success: true,
      data: response,
    });
  });
}