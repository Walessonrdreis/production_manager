import type { FastifyReply, FastifyRequest } from "fastify";
import { GetOrdersStage20UseCase } from "../../application/get-orders-stage20.usecase";

export async function getOrdersStage20Controller(
  _request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const useCase = new GetOrdersStage20UseCase();
    const result = await useCase.execute();
    return reply.code(200).send(result);
  } catch (error: any) {
    const msg = String(error?.message || "");

    // ✅ MODO B: Omie REDUNDANT → 429 + Retry-After (não bloqueia request)
    if (
      error?.code === "OMIE_REDUNDANT" ||
      msg.includes("REDUNDANT") ||
      msg.includes("Consumo redundante detectado")
    ) {
      const retryAfter = Number(error?.retryAfterSeconds ?? extractRetryAfterSeconds(msg) ?? 60);

      return reply
        .header("Retry-After", String(Number.isNaN(retryAfter) ? 60 : retryAfter))
        .code(429)
        .send({
          success: false,
          error: "INTEGRATION_UNAVAILABLE",
          message: msg || "Omie rate limited (REDUNDANT)",
          retryAfterSeconds: Number.isNaN(retryAfter) ? 60 : retryAfter,
        });
    }

    // Qualquer outro erro: mantém contrato
    return reply.code(500).send({
      success: false,
      error: "INTERNAL_ERROR",
      message: msg || "Unexpected error",
    });
  }
}

function extractRetryAfterSeconds(msg: string): number | null {
  const m = msg.match(/Aguarde\s+(\d+)\s+segundos/i);
  if (!m) return null;
  const s = Number(m[1]);
  return Number.isNaN(s) ? null : s;
}