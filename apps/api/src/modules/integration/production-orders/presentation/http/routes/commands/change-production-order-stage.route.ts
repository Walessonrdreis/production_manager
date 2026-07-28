// ---------------------------------------------------------------------------
// Route — Change Production Order Stage (Command)
// ---------------------------------------------------------------------------
// Enfileira o comando CHANGE_STAGE no CommandStore (PENDING) e retorna 202.
// O Queue Processor job executa contra o Omie depois.
// ---------------------------------------------------------------------------

import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { ChangeProductionOrderStageRequestSchema } from "../../schemas";
import { EnqueueChangeStageProductionOrderUseCase } from "../../../../application/use-cases/enqueue-change-stage-production-order.usecase";

export async function registerChangeProductionOrderStageRoute(app: FastifyInstance) {
    const useCase = new EnqueueChangeStageProductionOrderUseCase();

    app.post("/v1/integration/production-orders/commands/change-stage", async (request, reply) => {
        try {
            const validatedData = ChangeProductionOrderStageRequestSchema.parse(request.body);

            const result = await useCase.execute({
                externalRequestId: validatedData.externalRequestId,
                omieId: validatedData.omieId,
                stage: validatedData.stage,
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

            console.error("[OP][CHANGE_STAGE][ERROR]", error);

            return reply.code(500).send({
                success: false,
                error: "INTERNAL_ERROR",
                message: "An unexpected error occurred",
            });
        }
    });
}
