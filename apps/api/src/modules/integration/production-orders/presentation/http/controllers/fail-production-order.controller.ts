import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { productionOrderIntegrationStore } from "../../../infrastructure/db/production-order-integration.store";

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

  console.log("[OP][FAKE][FAIL] entrada", { externalRequestId });

  const body = FailBodySchema.parse(request.body);

  const record = productionOrderIntegrationStore.markFailed(
    externalRequestId,
    body
  );

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