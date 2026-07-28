import type { FastifyInstance } from "fastify";

import { ProductCatalogCommandStore } from "../../../../infrastructure/db/product-catalog-command.store";

export async function registerGetProductCatalogSyncStatusRoute(
  app: FastifyInstance
) {
  app.get(
    "/v1/integration/product-catalog/commands/:externalRequestId",
    async (request, reply) => {
      const { externalRequestId } = request.params as {
        externalRequestId: string;
      };

      const store = new ProductCatalogCommandStore();

      const command = await store.findByExternalRequestId(
        externalRequestId
      );

      if (!command) {
        return reply.code(404).send({
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Comando não encontrado",
          },
        });
      }

      return reply.code(200).send({
        success: true,
        data: {
          externalRequestId: command.externalRequestId,
          status: command.status,
          productCode: command.productCode,
          source: command.source,
          createdAt: command.createdAt,
          updatedAt: command.updatedAt,
          lastError: command.lastError,
        },
      });
    }
  );
}