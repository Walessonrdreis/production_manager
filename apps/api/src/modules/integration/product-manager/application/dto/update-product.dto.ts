// ---------------------------------------------------------------------------
// DTO — Update Product
// ---------------------------------------------------------------------------
// Payload para alterar um produto no Omie via AlterarProduto.
// ---------------------------------------------------------------------------

import { z } from "zod";

export const UpdateProductRequestSchema = z.object({
    externalRequestId: z.string().min(1, "externalRequestId is required"),
    productCode: z.string().min(1, "productCode is required"),
    description: z.string().optional(),
    sku: z.string().optional(),
    familyDescription: z.string().optional(),
    brand: z.string().optional(),
    unit: z.string().optional(),
    ncm: z.string().optional(),
});

export type UpdateProductRequest = z.infer<typeof UpdateProductRequestSchema>;

export type EnqueueUpdateProductData = {
    externalRequestId: string;
    productCode: string;
    description?: string;
    sku?: string;
    familyDescription?: string;
    brand?: string;
    unit?: string;
    ncm?: string;
};

export type ProcessUpdateProductData = {
    externalRequestId: string;
    productCode: string;
    description?: string;
    sku?: string;
    familyDescription?: string;
    brand?: string;
    unit?: string;
    ncm?: string;
};
