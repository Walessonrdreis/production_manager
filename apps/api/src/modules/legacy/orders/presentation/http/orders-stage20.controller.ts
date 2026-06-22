import type { FastifyReply, FastifyRequest } from "fastify";

/**
 * Integration endpoint (API 1) - Orders Stage 20
 *
 * Objetivo: impedir que chamadas indiretas (front/API2/admin/enriched) disparem Omie
 * enquanto você está em "produção de teste" e quer evitar REDUNDANT.
 *
 * Política:
 * - Se OMIE_STAGE20_SYNC_ENABLED === "false": retorna 200 com lista vazia (neutro)
 * - Caso contrário: retorna 503 orientando a usar o sync manual (admin)
 *
 * OBS: Este controller NÃO chama Omie e NÃO chama use cases.
 * Ele funciona como guardrail para estabilização.
 */
export async function getOrdersStage20Controller(
  _request: FastifyRequest,
  reply: FastifyReply
) {
  // ✅ MODO PASSIVO: desliga integração externa por ENV (Render)
  if (process.env.OMIE_STAGE20_SYNC_ENABLED === "false") {
    return reply.code(200).send({
      success: true,
      data: {
        orders: [],
        reason: "MANUAL_SYNC_ONLY",
      },
    });
  }

  // ✅ Caso você decida reativar no futuro, deixe explícito que o caminho correto é o sync manual
  return reply.code(503).send({
    success: false,
    error: "INTEGRATION_DISABLED",
    message:
      "Integração Omie para pedidos (stage20) desabilitada. Use POST /v1/admin/omie/orders/stage20/sync quando necessário.",
  });
}