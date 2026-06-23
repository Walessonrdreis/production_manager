// ---------------------------------------------------------------------------
// Route — Cancel Production Order (Command)
// ---------------------------------------------------------------------------
// Enfileira o comando CANCEL_OP no CommandStore (PENDING) e retorna 202.
// O Queue Processor job executa contra o Omie depois.
// ---------------------------------------------------------------------------

import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { CancelProductionOrderRequestSchema } from "../../schemas";

import { prisma } from "@/shared/db/prisma";
import { ProductionOrderCommandStore } from "../../../../infrastructure/db/production-order-command.store";

export async function registerCancelProductionOrderRoute(app: FastifyInstance) {
    app.post("/v1/integration/production-orders/commands/cancel", async (request, reply) => {
        try {
            const validatedData = CancelProductionOrderRequestSchema.parse(request.body);

            const commandStore = new ProductionOrderCommandStore(prisma);

            const { record, created } = await commandStore.enqueue({
                externalRequestId: validatedData.externalRequestId,
                commandType: "CANCEL_OP",
                source: "API2",
                payload: {
                    omieCode: validatedData.omieCode,
                    reason: validatedData.reason,
                },
            });

            return reply.code(202).send({
                success: true,
                data: {
                    externalRequestId: record.externalRequestId,
                    status: created ? "PENDING" : record.status,
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
