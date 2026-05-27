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
    status: z.enum(["ACCEPTED"]),
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

export type CreateProductionOrderRequest =
  z.infer<typeof CreateProductionOrderRequestSchema>;

export type CreateProductionOrderResponse =
  z.infer<typeof CreateProductionOrderResponseSchema>;