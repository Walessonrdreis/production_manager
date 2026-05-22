import type { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { GetStockPositionUseCase } from "../../application/get-stock-position.usecase";

// ✅ Schema simples igual ao padrão
const GetStockPositionRequestSchema = z.object({
  productId: z.string(),
});

export async function getStockPositionController(
  request: FastifyRequest<{
    Body: z.infer<typeof GetStockPositionRequestSchema>;
  }>,
  reply: FastifyReply,
  useCase?: GetStockPositionUseCase
) {
  try {
    const validatedData = GetStockPositionRequestSchema.parse(request.body);

    const useCaseInstance = useCase || new GetStockPositionUseCase();

    const result = await useCaseInstance.execute(validatedData);

    return reply.code(200).send(result);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({
        success: false,
        error: "VALIDATION_ERROR",
        message: "Invalid request payload",
      });
    }

    return reply.code(500).send({
      success: false,
      error: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
    });
  }
}