import { z } from "zod";
import type { FastifyRequest, FastifyReply } from "fastify";

import {
  CreateProductionOrderRequestSchema,
  ValidationErrorResponseSchema,
  InternalErrorResponseSchema,
} from "../schemas";

import { CreateProductionOrderUseCase } from "../../../application/use-cases/create-production-order.usecase";

export async function createProductionOrderController(
  request: FastifyRequest<{
    Body: z.infer<typeof CreateProductionOrderRequestSchema>;
  }>,
  reply: FastifyReply,
  useCase?: CreateProductionOrderUseCase
) {
  try {
    console.log("[OP][CONTROLLER] entrada", {
      externalRequestId: (request.body as any)?.externalRequestId,
    });

    const validatedData = CreateProductionOrderRequestSchema.parse(request.body);

    const useCaseInstance = useCase || new CreateProductionOrderUseCase();
    const successResponse = await useCaseInstance.execute(validatedData);

    return reply.code(202).send(successResponse);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationError: z.infer<typeof ValidationErrorResponseSchema> = {
        success: false,
        error: "VALIDATION_ERROR",
        message: "Invalid request payload",
      };

      return reply.code(400).send(validationError);
    }

    console.error("[OP][CONTROLLER][ERROR]", error);

    const internalError: z.infer<typeof InternalErrorResponseSchema> = {
      success: false,
      error: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
    };

    return reply.code(500).send(internalError);
  }
}