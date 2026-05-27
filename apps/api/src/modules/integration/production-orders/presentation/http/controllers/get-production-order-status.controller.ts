import type { FastifyReply, FastifyRequest } from "fastify";
import { productionOrderIntegrationStore } from "../../../infrastructure/db/production-order-integration.store";

export async function getProductionOrderStatusController(
  request: FastifyRequest<{ Params: { externalRequestId: string } }>,
  reply: FastifyReply
) {
  const { externalRequestId } = request.params;

  console.log("[OP][CONTROLLER][STATUS] entrada", { externalRequestId });

  const record =
    productionOrderIntegrationStore.getByExternalRequestId(externalRequestId);

  if (!record) {
    return reply.code(404).send({
      success: false,
      error: "NOT_FOUND",
      message: "Production order request not found",
    });
  }

  return reply.code(200).send({
    success: true,
    data: record,
  });
}