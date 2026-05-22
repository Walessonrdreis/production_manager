import type { FastifyRequest, FastifyReply } from "fastify";
import {
  CreateProductionOrderRequestSchema,
  CreateProductionOrderResponseSchema,
  ValidationErrorResponseSchema,
  InternalErrorResponseSchema,
} from "../schemas";
import { CreateProductionOrderUseCase } from "../../../application/use-cases/create-production-order.usecase";

export async function createProductionOrderController(
  request: FastifyRequest<{
    Body: typeof CreateProductionOrderRequestSchema._type;
  }>,
  reply: FastifyReply,
  useCase?: CreateProductionOrderUseCase
) {
  try {
    // Validar payload
    const validatedData = CreateProductionOrderRequestSchema.parse(request.body);

    // Chamar use case (sem lógica de negócio no controller)
    const useCaseInstance = useCase || new CreateProductionOrderUseCase();
    const successResponse = await useCaseInstance.execute(validatedData);

    return reply.code(202).send(successResponse);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationError: typeof ValidationErrorResponseSchema._type = {
        success: false,
        error: "VALIDATION_ERROR",
        message: "Invalid request payload",
      };

      return reply.code(400).send(validationError);
    }

    const internalError: typeof InternalErrorResponseSchema._type = {
      success: false,
      error: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
    };

    return reply.code(500).send(internalError);
  }
}

// Import necessário para o catch block
import { z } from "zod";