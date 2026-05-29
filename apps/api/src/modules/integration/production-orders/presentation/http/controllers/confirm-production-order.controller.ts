import type { FastifyReply, FastifyRequest } from "fastify";
import { FakeProductionOrderLifecycleGateway } from "../../../infrastructure/gateways/lifecycle/fake-production-order-lifecycle.gateway";

export async function confirmProductionOrderController(
  request: FastifyRequest<{ Params: { externalRequestId: string } }>,
  reply: FastifyReply
) {
  const { externalRequestId } = request.params;

  // ✅ Segurança operacional: lifecycle fake só quando gateway=fake
  if (process.env.PRODUCTION_ORDER_GATEWAY === "real") {
    return reply.code(405).send({
      success: false,
      error: "METHOD_NOT_ALLOWED",
      message: "Confirm is available only when PRODUCTION_ORDER_GATEWAY=fake",
    });
  }

  console.log("[OP][CONTROLLER][CONFIRM] entrada", { externalRequestId });

  const lifecycle = new FakeProductionOrderLifecycleGateway();
  const record = await lifecycle.confirm(externalRequestId);

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