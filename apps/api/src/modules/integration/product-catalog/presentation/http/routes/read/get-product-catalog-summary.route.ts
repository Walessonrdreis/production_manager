import type { FastifyInstance } from "fastify";
import { GetProductCatalogSummaryUseCase } from "../../../../application/use-cases/get-product-catalog-summary.usecase";

export async function registerGetProductCatalogSummaryRoute(
  app: FastifyInstance
) {
  const useCase = new GetProductCatalogSummaryUseCase();

  app.get("/v1/integration/product-catalog/read/summary", async (_request, reply) => {
    const data = await useCase.execute();

    return reply.send({
      success: true,
      data,
    });
  });
}