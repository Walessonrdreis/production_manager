// ---------------------------------------------------------------------------
// DTO — Create Product
// ---------------------------------------------------------------------------
// Payload para criar um produto no Omie via IncluirProduto.
// externalRequestId é obrigatório (idempotência).
// ---------------------------------------------------------------------------

import { z } from "zod";

export const CreateProductRequestSchema = z.object({
    externalRequestId: z.string().min(1, "externalRequestId is required"),
    description: z.string().min(1, "description is required"),
    sku: z.string().optional(),
    familyDescription: z.string().optional(),
    brand: z.string().optional(),
    unit: z.string().optional(),
    ncm: z.string().optional(),
});

export type CreateProductRequest = z.infer<typeof CreateProductRequestSchema>;

export type EnqueueCreateProductData = {
    externalRequestId: string;
    description: string;
    sku?: string;
    familyDescription?: string;
    brand?: string;
    unit?: string;
    ncm?: string;
};

export type ProcessCreateProductData = {
    externalRequestId: string;
    description: string;
    sku?: string;
    familyDescription?: string;
    brand?: string;
    unit?: string;
    ncm?: string;
};
