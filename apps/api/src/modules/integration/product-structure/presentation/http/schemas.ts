// ---------------------------------------------------------------------------
// Schemas — Product Structure Integration (Zod)
// ---------------------------------------------------------------------------
// Schemas de validação para todas as rotas do módulo product-structure.
// Segue o mesmo padrão de production-orders/presentation/http/schemas.ts.
// ---------------------------------------------------------------------------

import { z } from "zod";

// ─── Sync Product Structure ─────────────────────────────────────────────
export const SyncProductStructureRequestSchema = z.object({
    externalRequestId: z.string(),
    productCode: z.string(),
});

export const SyncProductStructureResponseSchema = z.object({
    success: z.boolean(),
    data: z.object({
        status: z.enum(["ACCEPTED", "CONFIRMED", "FAILED"]),
        externalRequestId: z.string(),
        productCode: z.string(),
    }),
});

// ─── Sync All Product Structures ────────────────────────────────────────
export const SyncAllProductStructureRequestSchema = z.object({
    externalRequestId: z.string().optional(),
    pageSize: z.number().int().positive().optional(),
    maxPages: z.number().int().positive().optional(),
});

export const SyncAllProductStructureResponseSchema = z.object({
    success: z.boolean(),
    data: z.object({
        status: z.enum(["ACCEPTED"]),
        externalRequestId: z.string(),
        resourceId: z.literal("__GLOBAL__"),
    }),
});

// ─── Apply Product Structure ────────────────────────────────────────────
export const ApplyProductStructureItemSchema = z.object({
    componentCode: z.string(),
    quantity: z.union([z.string(), z.number()]),
    unit: z.string().optional(),
    loss: z.union([z.string(), z.number()]).optional(),
});

export const ApplyProductStructureRequestSchema = z.object({
    externalRequestId: z.string(),
    productCode: z.string(),
    items: z.array(ApplyProductStructureItemSchema).min(1),
});

export const ApplyProductStructureResponseSchema = z.object({
    success: z.boolean(),
    data: z.object({
        status: z.enum(["ACCEPTED", "CONFIRMED", "FAILED"]),
        externalRequestId: z.string(),
        productCode: z.string(),
    }),
});

// ─── Delete Product Structure ───────────────────────────────────────────
export const DeleteProductStructureRequestSchema = z.object({
    externalRequestId: z.string(),
    productCode: z.string(),
});

export const DeleteProductStructureResponseSchema = z.object({
    success: z.boolean(),
    data: z.object({
        status: z.enum(["ACCEPTED", "CONFIRMED", "FAILED"]),
        externalRequestId: z.string(),
        productCode: z.string(),
    }),
});

// ─── Error Responses (genéricos) ────────────────────────────────────────
export const ValidationErrorResponseSchema = z.object({
    success: z.boolean(),
    error: z.literal("VALIDATION_ERROR"),
    message: z.string(),
});

export const InternalErrorResponseSchema = z.object({
    success: z.boolean(),
    error: z.literal("INTERNAL_ERROR"),
    message: z.string(),
});

export const NotFoundErrorResponseSchema = z.object({
    success: z.boolean(),
    error: z.literal("NOT_FOUND"),
    message: z.string(),
});

// ─── Command Accepted (genérico para 202) ───────────────────────────────
export const CommandAcceptedResponseSchema = z.object({
    success: z.boolean(),
    data: z.object({
        externalRequestId: z.string(),
        status: z.enum(["ACCEPTED"]),
    }),
});

// ─── Inferred Types ─────────────────────────────────────────────────────
export type SyncProductStructureRequest = z.infer<typeof SyncProductStructureRequestSchema>;
export type SyncProductStructureResponse = z.infer<typeof SyncProductStructureResponseSchema>;

export type SyncAllProductStructureRequest = z.infer<typeof SyncAllProductStructureRequestSchema>;
export type SyncAllProductStructureResponse = z.infer<typeof SyncAllProductStructureResponseSchema>;

export type ApplyProductStructureRequest = z.infer<typeof ApplyProductStructureRequestSchema>;
export type ApplyProductStructureResponse = z.infer<typeof ApplyProductStructureResponseSchema>;

export type DeleteProductStructureRequest = z.infer<typeof DeleteProductStructureRequestSchema>;
export type DeleteProductStructureResponse = z.infer<typeof DeleteProductStructureResponseSchema>;

export type ValidationErrorResponse = z.infer<typeof ValidationErrorResponseSchema>;
export type InternalErrorResponse = z.infer<typeof InternalErrorResponseSchema>;
export type NotFoundErrorResponse = z.infer<typeof NotFoundErrorResponseSchema>;
export type CommandAcceptedResponse = z.infer<typeof CommandAcceptedResponseSchema>;
