import type { FastifyInstance } from "fastify";

import { RefreshProductCatalogProductionReadyUseCase } from "../../../../application/use-cases/refresh-product-catalog-production-ready.usecase";
import { ProductCatalogProductionReadyReadModelStore } from "../../../../infrastructure/db/product-catalog-production-ready-read-model.store";

export async function registerRefreshProductCatalogProductionReadyRoute(
  app: FastifyInstance
) {
  const useCase = new RefreshProductCatalogProductionReadyUseCase(
    new ProductCatalogProductionReadyReadModelStore()
  );

  app.post(
    "/v1/admin/product-catalog/refresh-production-ready",
    async (_request, reply) => {
      const result = await useCase.execute();

      return reply.code(202).send({
        success: true,
        data: result,
      });
    }
  );
}