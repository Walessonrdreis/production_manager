// ---------------------------------------------------------------------------
// DTO — Inactivate Product
// ---------------------------------------------------------------------------
// Payload para inativar um produto no Omie via AlterarProduto (ativo=false).
// ---------------------------------------------------------------------------

import { z } from "zod";

export const InactivateProductRequestSchema = z.object({
    externalRequestId: z.string().min(1, "externalRequestId is required"),
    productCode: z.string().min(1, "productCode is required"),
});

export type InactivateProductRequest = z.infer<typeof InactivateProductRequestSchema>;

export type EnqueueInactivateProductData = {
    externalRequestId: string;
    productCode: string;
};

export type ProcessInactivateProductData = {
    externalRequestId: string;
    productCode: string;
};
