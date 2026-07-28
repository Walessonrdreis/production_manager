import type { FastifyInstance } from "fastify";

import { ProductCatalogIntegrationStore } from "../../../../infrastructure/db/product-catalog-integration.store";

export async function registerGetProductCatalogStatsRoute(
  app: FastifyInstance
) {
  const store = new ProductCatalogIntegrationStore();

  app.get("/v1/admin/read/products/catalog/stats", async (_request, reply) => {
    const data = await store.getStats();

    return reply.send({
      success: true,
      data,
    });
  });
}