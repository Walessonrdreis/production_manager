import type { FastifyInstance } from "fastify";
import { SalesOrderSyncCommandStore } from "../../../../infrastructure/db/sales-order-sync-command.store";

export async function registerGetSalesOrderSyncStatusRoute(
  app: FastifyInstance
) {
  const store = new SalesOrderSyncCommandStore();

  // ── Tracking canônico ────────────────────────────────────────────
  app.get(
    "/v1/integration/sales-order-sync/commands/:externalRequestId",
    async (request, reply) => {
      const { externalRequestId } = request.params as {
        externalRequestId: string;
      };

      const command = await store.findByExternalRequestId(externalRequestId);

      if (!command) {
        return reply.code(404).send({
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Comando não encontrado",
          },
        });
      }

      return reply.send({
        success: true,
        data: {
          externalRequestId: command.externalRequestId,
          status: command.status,
          resourceId: command.resourceId,
          source: command.source,
          createdAt: command.createdAt,
          updatedAt: command.updatedAt,
          completedAt: command.completedAt,
          lastError: command.lastError,
        },
      });
    }
  );
}