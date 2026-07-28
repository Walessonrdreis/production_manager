// ---------------------------------------------------------------------------
// Route — Cancel Production Order (Command)
// ---------------------------------------------------------------------------
// Enfileira o comando CANCEL_OP no CommandStore (PENDING) e retorna 202.
// O Queue Processor job executa contra o Omie depois.
// ---------------------------------------------------------------------------

import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { CancelProductionOrderRequestSchema } from "../../schemas";
import { EnqueueCancelProductionOrderUseCase } from "../../../../application/use-cases/enqueue-cancel-production-order.usecase";

export async function registerCancelProductionOrderRoute(app: FastifyInstance) {
    const useCase = new EnqueueCancelProductionOrderUseCase();

    app.post("/v1/integration/production-orders/commands/cancel", async (request, reply) => {
        try {
            const validatedData = CancelProductionOrderRequestSchema.parse(request.body);

            const result = await useCase.execute({
                externalRequestId: validatedData.externalRequestId,
                omieId: validatedData.omieId,
                reason: validatedData.reason,
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

            console.error("[OP][CANCEL][ERROR]", error);

            return reply.code(500).send({
                success: false,
                error: "INTERNAL_ERROR",
                message: "An unexpected error occurred",
            });
        }
    });
}
