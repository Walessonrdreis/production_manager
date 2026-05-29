import type { FastifyReply, FastifyRequest } from "fastify";
import { FakeProductionOrderQueryGateway } from "../../../infrastructure/gateways/query/fake-production-order-query.gateway";

export async function getProductionOrderStatusController(
  request: FastifyRequest<{ Params: { externalRequestId: string } }>,
  reply: FastifyReply
) {
  const { externalRequestId } = request.params;

  console.log("[OP][CONTROLLER][STATUS] entrada", { externalRequestId });

  // ✅ capacidade Query (hoje: fake lendo do store)
  const query = new FakeProductionOrderQueryGateway();
  const record = await query.getByExternalRequestId(externalRequestId);

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