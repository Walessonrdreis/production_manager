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

    // ✅ Se Omie pedir para aguardar (REDUNDANT), não segure conexão
    if (msg.includes("REDUNDANT") || msg.includes("Consumo redundante detectado")) {
      const m = msg.match(/Aguarde\s+(\d+)\s+segundos/i);
      const retryAfter = m ? Number(m[1]) : 60;

      return reply
        .header("Retry-After", String(retryAfter))
        .code(429)
        .send({
          success: false,
          error: "INTEGRATION_UNAVAILABLE",
          message: msg,
          retryAfterSeconds: Number.isNaN(retryAfter) ? 60 : retryAfter,
        });
    }

    return reply.code(500).send({
      success: false,
      error: "INTERNAL_ERROR",
      message: msg || "Unexpected error",
    });
  }
}