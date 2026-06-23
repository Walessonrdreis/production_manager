// ---------------------------------------------------------------------------
// Route — Update Production Order (Command)
// ---------------------------------------------------------------------------
// Enfileira o comando UPDATE_OP no CommandStore (PENDING) e retorna 202.
// O Queue Processor job executa contra o Omie depois.
// ---------------------------------------------------------------------------

import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { UpdateProductionOrderRequestSchema } from "../../schemas";

import { prisma } from "@/shared/db/prisma";
import { ProductionOrderCommandStore } from "../../../../infrastructure/db/production-order-command.store";

export async function registerUpdateProductionOrderRoute(app: FastifyInstance) {
    app.post("/v1/integration/production-orders/commands/update", async (request, reply) => {
        try {
            const validatedData = UpdateProductionOrderRequestSchema.parse(request.body);

            const commandStore = new ProductionOrderCommandStore(prisma);

            const { record, created } = await commandStore.enqueue({
                externalRequestId: validatedData.externalRequestId,
                commandType: "UPDATE_OP",
                source: "API2",
                payload: {
                    omieCode: validatedData.omieCode,
                    quantity: validatedData.quantity,
                    forecastDate: validatedData.forecastDate,
                    notes: validatedData.notes,
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

            console.error("[OP][UPDATE][ERROR]", error);

            return reply.code(500).send({
                success: false,
                error: "INTERNAL_ERROR",
                message: "An unexpected error occurred",
            });
        }
    });
}
