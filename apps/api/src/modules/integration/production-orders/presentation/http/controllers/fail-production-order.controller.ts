import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { FakeProductionOrderLifecycleGateway } from "../../../infrastructure/gateways/lifecycle/fake-production-order-lifecycle.gateway";

const FailBodySchema = z.object({
  code: z.string(),
  message: z.string(),
});

export async function failProductionOrderController(
  request: FastifyRequest<{
    Params: { externalRequestId: string };
    Body: z.infer<typeof FailBodySchema>;
  }>,
  reply: FastifyReply
) {
  const { externalRequestId } = request.params;

  // ✅ Segurança operacional: lifecycle fake só quando gateway=fake
  if (process.env.PRODUCTION_ORDER_GATEWAY === "real") {
    return reply.code(405).send({
      success: false,
      error: "METHOD_NOT_ALLOWED",
      message: "Fail is available only when PRODUCTION_ORDER_GATEWAY=fake",
    });
  }

  console.log("[OP][CONTROLLER][FAIL] entrada", { externalRequestId });

  const body = FailBodySchema.parse(request.body);

  const lifecycle = new FakeProductionOrderLifecycleGateway();
  const record = await lifecycle.fail(externalRequestId, body);

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
