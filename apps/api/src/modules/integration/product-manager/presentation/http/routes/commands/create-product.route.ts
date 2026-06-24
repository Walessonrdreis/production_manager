// ---------------------------------------------------------------------------
// Route — Create Product (Command)
// ---------------------------------------------------------------------------
// Enfileira o comando no PgBoss e retorna 202 Accepted.
// O processamento assíncrono executa a criação no Omie.
// ---------------------------------------------------------------------------

import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { CreateProductRequestSchema } from "../../schemas";
import { EnqueueCreateProductUseCase } from "../../../../application/use-cases/enqueue-create-product.usecase";

export async function registerCreateProductRoute(app: FastifyInstance) {
    const useCase = new EnqueueCreateProductUseCase();

    app.post("/v1/integration/product-manager/commands/create", async (request, reply) => {
        try {
            const validatedData = CreateProductRequestSchema.parse(request.body);

            const result = await useCase.execute({
                externalRequestId: validatedData.externalRequestId,
                description: validatedData.description,
                sku: validatedData.sku,
                familyDescription: validatedData.familyDescription,
                brand: validatedData.brand,
                unit: validatedData.unit,
                ncm: validatedData.ncm,
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

            console.error("[PRODUCT-MANAGER][CREATE][ERROR]", error);

            return reply.code(500).send({
                success: false,
                error: "INTERNAL_ERROR",
                message: "An unexpected error occurred",
            });
        }
    });
}
