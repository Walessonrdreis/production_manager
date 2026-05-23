import type { FastifyRequest, FastifyReply } from "fastify";
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
    return reply.code(500).send({
      success: false,
      error: "INTERNAL_ERROR",
      message: error?.message || "Unexpected error",
    });
  }
}