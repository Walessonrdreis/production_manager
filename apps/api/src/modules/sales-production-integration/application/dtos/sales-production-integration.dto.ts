import { z } from "zod";

export const SalesToProductionRequestSchema = z.object({
  orderId: z.string().uuid(),
  customerType: z.enum(["regular", "vip", "corporate"]),
  orderValue: z.number().positive(),
  deliveryDeadline: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export const SalesToProductionResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    id: z.string().uuid(),
    orderId: z.string().uuid(),
    priority: z.enum(["high", "medium", "low"]),
    status: z.enum(["pending", "in_progress", "completed", "cancelled"]),
    position: z.number(),
    estimatedStartDate: z.string().datetime(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }),
  message: z.string(),
});

export const IntegrationStatisticsSchema = z.object({
  totalIntegrated: z.number(),
  byPriority: z.object({
    high: z.number(),
    medium: z.number(),
    low: z.number(),
  }),
  byCustomerType: z.object({
    regular: z.number(),
    vip: z.number(),
    corporate: z.number(),
  }),
  averageIntegrationTime: z.number(),
  lastIntegrationAt: z.string().datetime().optional(),
});

export const IntegrationStatisticsResponseSchema = z.object({
  success: z.boolean(),
  data: IntegrationStatisticsSchema,
  message: z.string(),
});

export type SalesToProductionRequest = z.infer<typeof SalesToProductionRequestSchema>;
export type SalesToProductionResponse = z.infer<typeof SalesToProductionResponseSchema>;
export type IntegrationStatistics = z.infer<typeof IntegrationStatisticsSchema>;
export type IntegrationStatisticsResponse = z.infer<typeof IntegrationStatisticsResponseSchema>;