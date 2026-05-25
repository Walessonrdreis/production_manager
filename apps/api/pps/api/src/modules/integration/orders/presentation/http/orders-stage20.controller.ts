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
    // ✅ modo produção: não espera; devolve Retry-After
    if (error?.code === "OMIE_REDUNDANT") {
      const retryAfter = Number(error?.retryAfterSeconds ?? 60);

      return reply
        .header("Retry-After", String(retryAfter))
        .code(429)
        .send({
          success: false,
          error: "INTEGRATION_UNAVAILABLE",
          message: error?.message || "Omie rate limited (REDUNDANT)",
          retryAfterSeconds: Number.isNaN(retryAfter) ? 60 : retryAfter,
        });
    }

    return reply.code(500).send({
      success: false,
      error: "INTERNAL_ERROR",
      message: error?.message || "Unexpected error",
    });
  }
}
