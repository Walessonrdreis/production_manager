// ---------------------------------------------------------------------------
// Route — Create Production Order (Command)
// ---------------------------------------------------------------------------

import type { FastifyInstance } from "fastify";
import { z } from "zod";

import {
  CreateProductionOrderRequestSchema,
} from "../../schemas";

import { CreateProductionOrderUseCase } from "../../../../application/use-cases/create-production-order.usecase";

export async function registerCreateProductionOrderRoute(app: FastifyInstance) {
  app.post("/v1/integration/production-order", async (request, reply) => {
    try {
      const validatedData = CreateProductionOrderRequestSchema.parse(request.body);

      const useCase = new CreateProductionOrderUseCase();
      const successResponse = await useCase.execute(validatedData);

      return reply.code(202).send(successResponse);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: "VALIDATION_ERROR",
          message: "Invalid request payload",
        });
      }

      console.error("[OP][CREATE][ERROR]", error);

      return reply.code(500).send({
        success: false,
        error: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      });
    }
  });
}
