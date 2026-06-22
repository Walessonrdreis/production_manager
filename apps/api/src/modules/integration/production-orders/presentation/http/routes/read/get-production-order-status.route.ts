// ---------------------------------------------------------------------------
// Route — Get Production Order Status (Read)
// ---------------------------------------------------------------------------

import type { FastifyInstance } from "fastify";
import { FakeProductionOrderQueryGateway } from "../../../../infrastructure/gateways/query/fake-production-order-query.gateway";

export async function registerGetProductionOrderStatusRoute(
  app: FastifyInstance
) {
  app.get(
    "/v1/integration/production-order/:externalRequestId",
    async (request, reply) => {
      const { externalRequestId } = request.params as {
        externalRequestId: string;
      };

      const query = new FakeProductionOrderQueryGateway();
      const record = await query.getByExternalRequestId(externalRequestId);

      if (!record) {
        return reply.code(404).send({
          success: false,
          error: "NOT_FOUND",
          message: "Production order request not found",
        });
      }

      return reply.code(200).send({ success: true, data: record });
    }
  );
}
