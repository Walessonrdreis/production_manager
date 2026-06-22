import { z } from "zod";

export const CreateProductionOrderRequestSchema = z.object({
  productId: z.string(),
  quantity: z.number().positive(),
  externalRequestId: z.string(),
  scheduledDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export const CreateProductionOrderResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    externalRequestId: z.string(),
    status: z.enum(["PENDING"]),
  }),
});

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

// ✅ NOVO: Tracking (GET por externalRequestId)
export const ProductionOrderIntegrationStatusSchema = z.enum([
  "PENDING",
  "PROCESSING",
  "ACCEPTED",
  "CONFIRMED",
  "FAILED",
]);

export const GetProductionOrderStatusResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    externalRequestId: z.string(),
    productId: z.string(),
    quantity: z.number(),
    scheduledDate: z.string().optional(),
    notes: z.string().optional(),

    status: ProductionOrderIntegrationStatusSchema,

    omieProductionOrderId: z.number().optional(),

    createdAt: z.string(),
    updatedAt: z.string(),

    lastError: z
      .object({
        code: z.string(),
        message: z.string(),
      })
      .optional(),
  }),
});

export const NotFoundErrorResponseSchema = z.object({
  success: z.boolean(),
  error: z.literal("NOT_FOUND"),
  message: z.string(),
});

export type CreateProductionOrderRequest = z.infer<typeof CreateProductionOrderRequestSchema>;
export type CreateProductionOrderResponse = z.infer<typeof CreateProductionOrderResponseSchema>;
export type ValidationErrorResponse = z.infer<typeof ValidationErrorResponseSchema>;
export type InternalErrorResponse = z.infer<typeof InternalErrorResponseSchema>;

export type GetProductionOrderStatusResponse = z.infer<typeof GetProductionOrderStatusResponseSchema>;
export type NotFoundErrorResponse = z.infer<typeof NotFoundErrorResponseSchema>;