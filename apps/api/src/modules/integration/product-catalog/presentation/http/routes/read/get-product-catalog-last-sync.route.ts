import type { FastifyInstance } from "fastify";

import { ProductCatalogCommandStore } from "../../../../infrastructure/db/product-catalog-command.store";

export async function registerGetProductCatalogLastSyncRoute(
  app: FastifyInstance
) {
  const store = new ProductCatalogCommandStore();

  app.get(
    "/v1/integration/product-catalog/read/last-sync",
    async (_request, reply) => {
      const data = await store.getLatestGlobalSync();

      if (!data) {
        return reply.code(404).send({
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Nenhum sync global encontrado",
          },
        });
      }

      return reply.send({
        success: true,
        data,
      });
    }
  );
}