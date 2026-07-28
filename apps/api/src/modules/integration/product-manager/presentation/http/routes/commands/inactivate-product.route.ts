// ---------------------------------------------------------------------------
// Route — Inactivate Product (Command)
// ---------------------------------------------------------------------------

import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { InactivateProductRequestSchema } from "../../schemas";
import { EnqueueInactivateProductUseCase } from "../../../../application/use-cases/enqueue-inactivate-product.usecase";

export async function registerInactivateProductRoute(app: FastifyInstance) {
    const useCase = new EnqueueInactivateProductUseCase();

    app.post("/v1/integration/product-manager/commands/inactivate", async (request, reply) => {
        try {
            const validatedData = InactivateProductRequestSchema.parse(request.body);

            const result = await useCase.execute({
                externalRequestId: validatedData.externalRequestId,
                productCode: validatedData.productCode,
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

            console.error("[PRODUCT-MANAGER][INACTIVATE][ERROR]", error);

            return reply.code(500).send({
                success: false,
                error: "INTERNAL_ERROR",
                message: "An unexpected error occurred",
            });
        }
    });
}
