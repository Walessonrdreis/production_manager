import type { FastifyInstance } from "fastify";

import { ProductCatalogCommandStore } from "../../../../infrastructure/db/product-catalog-command.store";
import { parseNumber } from "../../../../application/utils/query.utils";

export async function registerGetProductCatalogSyncFailuresRoute(
  app: FastifyInstance
) {
  const store = new ProductCatalogCommandStore();

  app.get(
    "/v1/integration/product-catalog/read/sync-failures",
    async (request, reply) => {
      const query = request.query as Record<string, unknown>;
      const limit = parseNumber(query.limit, 20);

      const data = await store.listFailures(limit);

      return reply.send({
        success: true,
        data,
      });
    }
  );
}