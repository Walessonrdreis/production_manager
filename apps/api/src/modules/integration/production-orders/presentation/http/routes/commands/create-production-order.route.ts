// ---------------------------------------------------------------------------
// Route — Create Production Order (Command)
// ---------------------------------------------------------------------------
// Enfileira o comando no CommandStore (PENDING) e retorna 202.
// O Queue Processor job executa contra o Omie depois.
// ---------------------------------------------------------------------------

import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { CreateProductionOrderRequestSchema } from "../../schemas";
import { EnqueueCreateProductionOrderUseCase } from "../../../../application/use-cases/enqueue-create-production-order.usecase";

export async function registerCreateProductionOrderRoute(app: FastifyInstance) {
    const useCase = new EnqueueCreateProductionOrderUseCase();

    app.post("/v1/integration/production-orders/commands/create", async (request, reply) => {
        try {
            const validatedData = CreateProductionOrderRequestSchema.parse(request.body);

            const result = await useCase.execute({
                externalRequestId: validatedData.externalRequestId,
                productId: validatedData.productId,
                quantity: validatedData.quantity,
                scheduledDate: validatedData.scheduledDate,
                notes: validatedData.notes,
            });

            return reply.code(202).send({
                success: true,
                data: result,
            });
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
