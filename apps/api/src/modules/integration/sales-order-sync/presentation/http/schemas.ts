// ---------------------------------------------------------------------------
// Schemas — Sales Order Sync Integration (Zod)
// ---------------------------------------------------------------------------
// Schemas de validação para todas as rotas do módulo sales-order-sync.
// Segue o mesmo padrão de product-structure/presentation/http/schemas.ts.
// ---------------------------------------------------------------------------

import { z } from "zod";

// ─── Sync All Sales Orders ───────────────────────────────────────────────
export const SyncAllSalesOrdersRequestSchema = z.object({
    /** ⚠️ Obrigatório — usado como chave de idempotência (externalRequestId) */
    externalRequestId: z.string().min(1, "externalRequestId é obrigatório"),
    pageSize: z.number().int().positive().optional(),
    maxPages: z.number().int().positive().optional(),
});

export const SyncAllSalesOrdersResponseSchema = z.object({
    success: z.boolean(),
    data: z.object({
        status: z.enum(["ACCEPTED"]),
        externalRequestId: z.string(),
        resourceId: z.literal("__GLOBAL__"),
        lastSyncAt: z.string().nullable().optional(),
    }),
});

// ─── Sync Status ─────────────────────────────────────────────────────────
export const SyncStatusParamsSchema = z.object({
    externalRequestId: z.string(),
});

export const SyncStatusResponseSchema = z.object({
    success: z.boolean(),
    data: z.object({
        externalRequestId: z.string(),
        status: z.enum(["ACCEPTED", "CONFIRMED", "FAILED"]),
        resourceId: z.string(),
        source: z.string().nullable(),
        createdAt: z.string(),
        updatedAt: z.string().nullable(),
        completedAt: z.string().nullable(),
        lastError: z.string().nullable(),
    }),
});

// ─── Sales Order Summary (List) ──────────────────────────────────────────
export const ListSalesOrdersQuerySchema = z.object({
    stage: z.string().optional(),
    isCanceled: z.enum(["true", "false"]).optional(),
    isClosed: z.enum(["true", "false"]).optional(),
    activeOnly: z.enum(["true", "false"]).optional(),
    customerOmieId: z.string().optional(),
    q: z.string().optional(),
    limit: z.coerce.number().int().positive().optional(),
    offset: z.coerce.number().int().min(0).optional(),
});

export const SalesOrderSummaryItemSchema = z.object({
    id: z.string(),
    orderNumber: z.string().nullable(),
    stage: z.string(),
    customerName: z.string().nullable(),
    customerOmieId: z.string().nullable(),
    total: z.number().nullable(),
    forecastDate: z.string().nullable(),
    isCanceled: z.boolean(),
    isClosed: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

export const ListSalesOrdersResponseSchema = z.object({
    success: z.boolean(),
    data: z.array(SalesOrderSummaryItemSchema),
    meta: z.object({
        total: z.number(),
        pageSize: z.number(),
        pageCount: z.number(),
        offset: z.number(),
    }),
});

// ─── Sales Order Stats ───────────────────────────────────────────────────
export const SalesOrderStatsResponseSchema = z.object({
    success: z.boolean(),
    data: z.object({
        total: z.number(),
        canceled: z.number(),
        closed: z.number(),
        open: z.number(),
    }),
});

// ─── Sales Order Transitions ─────────────────────────────────────────────
export const ListTransitionsQuerySchema = z.object({
    salesOrderOmieId: z.string().optional(),
    toStage: z.string().optional(),
    limit: z.coerce.number().int().positive().optional(),
    offset: z.coerce.number().int().min(0).optional(),
});

export const TransitionItemSchema = z.object({
    id: z.string(),
    salesOrderOmieId: z.string(),
    fromStage: z.string().nullable(),
    toStage: z.string(),
    createdAt: z.string(),
});

export const ListTransitionsResponseSchema = z.object({
    success: z.boolean(),
    data: z.array(TransitionItemSchema),
    meta: z.object({
        total: z.number(),
        pageSize: z.number(),
        pageCount: z.number(),
        offset: z.number(),
    }),
});

// ─── Sales Order Transitions by Order ────────────────────────────────────
export const OrderTransitionsParamsSchema = z.object({
    omieId: z.string(),
});

export const OrderTransitionsResponseSchema = z.object({
    success: z.boolean(),
    data: z.array(TransitionItemSchema),
});

// ─── Sales Order Open Items ──────────────────────────────────────────────
export const ListOpenItemsQuerySchema = z.object({
    q: z.string().optional(),
    limit: z.coerce.number().int().positive().optional(),
    offset: z.coerce.number().int().min(0).optional(),
});

export const OpenItemSchema = z.object({
    salesOrderId: z.string(),
    orderNumber: z.string().nullable(),
    customerName: z.string().nullable(),
    productCode: z.string(),
    description: z.string(),
    quantity: z.number(),
    unit: z.string().nullable(),
    forecastDate: z.string().nullable(),
});

export const ListOpenItemsResponseSchema = z.object({
    success: z.boolean(),
    data: z.array(OpenItemSchema),
    meta: z.object({
        total: z.number(),
        pageSize: z.number(),
        pageCount: z.number(),
        offset: z.number(),
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

// ─── Callbacks ───────────────────────────────────────────────────────────
export const ConfirmCallbackParamsSchema = z.object({
    externalRequestId: z.string(),
});

export const FailCallbackBodySchema = z.object({
    code: z.string(),
    message: z.string(),
});

export const CallbackResponseSchema = z.object({
    success: z.boolean(),
    data: z.object({
        externalRequestId: z.string(),
        status: z.enum(["ACCEPTED", "CONFIRMED", "FAILED"]),
    }),
});

// ─── Queue ───────────────────────────────────────────────────────────────
export const QueueItemSchema = z.object({
    externalRequestId: z.string(),
    status: z.enum(["ACCEPTED", "CONFIRMED", "FAILED"]),
    resourceId: z.string(),
    source: z.string().nullable(),
    createdAt: z.date(),
    updatedAt: z.date().nullable(),
});

export const QueueResponseSchema = z.object({
    success: z.boolean(),
    data: z.array(QueueItemSchema),
    meta: z.object({
        total: z.number(),
        limit: z.number(),
        offset: z.number(),
    }),
});

// ─── Failures ────────────────────────────────────────────────────────────
export const FailureItemSchema = z.object({
    externalRequestId: z.string(),
    status: z.enum(["ACCEPTED", "CONFIRMED", "FAILED"]),
    resourceId: z.string(),
    source: z.string().nullable(),
    lastError: z.any().nullable(),
    createdAt: z.date(),
    updatedAt: z.date().nullable(),
    completedAt: z.date().nullable(),
});

export const FailuresResponseSchema = z.object({
    success: z.boolean(),
    data: z.array(FailureItemSchema),
    meta: z.object({
        total: z.number(),
        limit: z.number(),
        offset: z.number(),
    }),
});

export const NotFoundErrorResponseSchema = z.object({
    success: z.boolean(),
    error: z.literal("NOT_FOUND"),
    message: z.string(),
});

export const MethodNotAllowedErrorResponseSchema = z.object({
    success: z.boolean(),
    error: z.literal("METHOD_NOT_ALLOWED"),
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
export type SyncAllSalesOrdersRequest = z.infer<typeof SyncAllSalesOrdersRequestSchema>;
export type SyncAllSalesOrdersResponse = z.infer<typeof SyncAllSalesOrdersResponseSchema>;

export type SyncStatusParams = z.infer<typeof SyncStatusParamsSchema>;
export type SyncStatusResponse = z.infer<typeof SyncStatusResponseSchema>;

export type ListSalesOrdersQuery = z.infer<typeof ListSalesOrdersQuerySchema>;
export type SalesOrderSummaryItem = z.infer<typeof SalesOrderSummaryItemSchema>;
export type ListSalesOrdersResponse = z.infer<typeof ListSalesOrdersResponseSchema>;

export type SalesOrderStatsResponse = z.infer<typeof SalesOrderStatsResponseSchema>;

export type ListTransitionsQuery = z.infer<typeof ListTransitionsQuerySchema>;
export type TransitionItem = z.infer<typeof TransitionItemSchema>;
export type ListTransitionsResponse = z.infer<typeof ListTransitionsResponseSchema>;

export type OrderTransitionsParams = z.infer<typeof OrderTransitionsParamsSchema>;
export type OrderTransitionsResponse = z.infer<typeof OrderTransitionsResponseSchema>;

export type ListOpenItemsQuery = z.infer<typeof ListOpenItemsQuerySchema>;
export type OpenItem = z.infer<typeof OpenItemSchema>;
export type ListOpenItemsResponse = z.infer<typeof ListOpenItemsResponseSchema>;

export type ValidationErrorResponse = z.infer<typeof ValidationErrorResponseSchema>;
export type InternalErrorResponse = z.infer<typeof InternalErrorResponseSchema>;
export type NotFoundErrorResponse = z.infer<typeof NotFoundErrorResponseSchema>;
export type MethodNotAllowedErrorResponse = z.infer<typeof MethodNotAllowedErrorResponseSchema>;
export type CommandAcceptedResponse = z.infer<typeof CommandAcceptedResponseSchema>;
