// ---------------------------------------------------------------------------
// Schemas — Product Manager Routes
// ---------------------------------------------------------------------------
// Esquemas de validação para as rotas do módulo product-manager.
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

export const InactivateProductRequestSchema = z.object({
    externalRequestId: z.string().min(1, "externalRequestId is required"),
    productCode: z.string().min(1, "productCode is required"),
});
