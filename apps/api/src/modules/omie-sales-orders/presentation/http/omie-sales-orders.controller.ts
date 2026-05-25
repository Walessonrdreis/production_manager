import type { FastifyReply, FastifyRequest } from "fastify";

export async function getOrdersStage20Controller(
  _request: FastifyRequest,
  reply: FastifyReply
) {
  // ✅ Integração desabilitada em modo manual
  if (process.env.OMIE_STAGE20_SYNC_ENABLED === "false") {
    return reply.code(200).send({
      success: true,
      data: {
        orders: [],
        reason: "MANUAL_SYNC_ONLY",
      },
    });
  }

  return reply.code(503).send({
    success: false,
    error: "INTEGRATION_DISABLED",
    message: "Integração Omie desabilitada. Use o endpoint manual de sync.",
  });
}
