// ---------------------------------------------------------------------------
// Route — Cancel Production Order (Command)
// ---------------------------------------------------------------------------
// Enfileira o comando CANCEL_OP no CommandStore (PENDING) e retorna 202.
// O Queue Processor job executa contra o Omie depois.
// ---------------------------------------------------------------------------

import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { CancelProductionOrderRequestSchema } from "../../schemas";
import { enqueueJob } from "@/shared/infra/job-queue";

export async function registerCancelProductionOrderRoute(app: FastifyInstance) {
    app.post("/v1/integration/production-orders/commands/cancel", async (request, reply) => {
        try {
            const validatedData = CancelProductionOrderRequestSchema.parse(request.body);

            await enqueueJob("production-order.cancel-op", {
                externalRequestId: validatedData.externalRequestId,
                omieCode: validatedData.omieCode,
                reason: validatedData.reason,
            }, {
                retryLimit: 5,
                retryBackoff: true,
                singletonKey: `production-order-cancel-${validatedData.externalRequestId}`,
            });

            return reply.code(202).send({
                success: true,
                data: {
                    externalRequestId: validatedData.externalRequestId,
                    status: "PENDING",
                },
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
