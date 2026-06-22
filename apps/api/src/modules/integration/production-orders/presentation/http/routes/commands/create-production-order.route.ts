// ---------------------------------------------------------------------------
// Route — Create Production Order (Command)
// ---------------------------------------------------------------------------
// Enfileira o comando no CommandStore (PENDING) e retorna 202.
// O Queue Processor job executa contra o Omie depois.
// ---------------------------------------------------------------------------

import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { CreateProductionOrderRequestSchema } from "../../schemas";

import { prisma } from "@/shared/db/prisma";
import { ProductionOrderCommandStore } from "../../../../infrastructure/db/production-order-command.store";

export async function registerCreateProductionOrderRoute(app: FastifyInstance) {
    app.post("/v1/integration/production-order", async (request, reply) => {
        try {
            const validatedData = CreateProductionOrderRequestSchema.parse(request.body);

            const commandStore = new ProductionOrderCommandStore(prisma);

            const { record, created } = await commandStore.enqueue({
                externalRequestId: validatedData.externalRequestId,
                commandType: "CREATE_OP",
                source: "API2",
                payload: {
                    productId: validatedData.productId,
                    quantity: validatedData.quantity,
                    scheduledDate: validatedData.scheduledDate,
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

            console.error("[OP][CREATE][ERROR]", error);

            return reply.code(500).send({
                success: false,
                error: "INTERNAL_ERROR",
                message: "An unexpected error occurred",
            });
        }
    });
}
