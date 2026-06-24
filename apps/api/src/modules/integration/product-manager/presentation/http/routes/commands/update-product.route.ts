// ---------------------------------------------------------------------------
// Route — Update Product (Command)
// ---------------------------------------------------------------------------

import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { UpdateProductRequestSchema } from "../../schemas";
import { EnqueueUpdateProductUseCase } from "../../../../application/use-cases/enqueue-update-product.usecase";

export async function registerUpdateProductRoute(app: FastifyInstance) {
    const useCase = new EnqueueUpdateProductUseCase();

    app.post("/v1/integration/product-manager/commands/update", async (request, reply) => {
        try {
            const validatedData = UpdateProductRequestSchema.parse(request.body);

            const result = await useCase.execute({
                externalRequestId: validatedData.externalRequestId,
                productCode: validatedData.productCode,
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

            console.error("[PRODUCT-MANAGER][UPDATE][ERROR]", error);

            return reply.code(500).send({
                success: false,
                error: "INTERNAL_ERROR",
                message: "An unexpected error occurred",
            });
        }
    });
}
