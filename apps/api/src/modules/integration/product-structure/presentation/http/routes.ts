import type { FastifyInstance } from "fastify";
import { env } from "@/config";

import { ProductStructureIntegrationStore } from "../../infrastructure/db/product-structure-integration.store";
import { FakeProductStructureFetchGateway } from "../../infrastructure/gateways/fetch/fake-product-structure-fetch.gateway";
import { RealProductStructureFetchGateway } from "../../infrastructure/gateways/fetch/real-product-structure-fetch.gateway";

import { SyncProductStructureUseCase } from "../../application/use-cases/sync-product-structure.usecase";
import { GetProductsProductionReadModelUseCase } from "../../application/use-cases/get-products-production-read-model.usecase";

import { GetProductsProductionController } from "./controllers/get-products-production.controller";

export async function productStructureIntegrationRoutes(app: FastifyInstance) {
  // ✅ store (injeta Prisma do Fastify)
  const store = new ProductStructureIntegrationStore(app.prisma);

  // ✅ seleção Real/Fake CENTRALIZADA (somente aqui)
  const gateway =
    env.PRODUCT_STRUCTURE_GATEWAY === "fake"
      ? new FakeProductStructureFetchGateway()
      : new RealProductStructureFetchGateway(app.omieClient);

  // ✅ usecases
  const syncUseCase = new SyncProductStructureUseCase(gateway, store);
  void syncUseCase; // pronto para job / lazy fetch (não usado ainda)

  const readModelUseCase = new GetProductsProductionReadModelUseCase(app.prisma);
  const controller = new GetProductsProductionController(readModelUseCase);

  // ✅ endpoint agregado (read-model)
  app.get(
    "/v1/admin/read/products/production",
    {
      schema: {
        tags: ["product-structure"],
        summary: "Lista produtos com readiness para produção",
        description:
          "Read-model agregado: retorna hasStructure e canCreateProductionOrder (sem chamar Omie).",
      },
    },
    controller.handle.bind(controller)
  );

  /**
   * Opcional (futuro): endpoint para disparar sync/refresh sob demanda:
   * POST /v1/admin/omie/product-structure/:productCode/sync
   * - chamaria syncUseCase.execute(productCode)
   */
}