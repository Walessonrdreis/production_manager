import { z } from "zod";

export const SyncOrdersRequestSchema = z.object({
  forceRefresh: z.boolean().optional().default(false),
  orderStatus: z.enum(["all", "pending", "in_production", "completed", "cancelled"]).optional().default("all"),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  batchSize: z.number().int().positive().max(500).optional().default(100),
  includeProductionOrders: z.boolean().optional().default(true),
  includeSalesOrders: z.boolean().optional().default(true),
});

export const SyncOrdersResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    totalOrders: z.number().int().nonnegative(),
    syncedOrders: z.number().int().nonnegative(),
    failedOrders: z.number().int().nonnegative(),
    productionOrders: z.number().int().nonnegative(),
    salesOrders: z.number().int().nonnegative(),
    durationMs: z.number().int().positive(),
    nextSyncAt: z.string().datetime().optional(),
  }),
  timestamp: z.string().datetime(),
});

export const OrderSyncResultSchema = z.object({
  orderId: z.string(),
  orderType: z.enum(["production", "sales"]),
  status: z.enum(["success", "failed", "skipped"]),
  error: z.string().optional(),
  syncedAt: z.string().datetime(),
});

export const BatchSyncResultSchema = z.object({
  batchId: z.string(),
  totalItems: z.number().int().nonnegative(),
  successfulItems: z.number().int().nonnegative(),
  failedItems: z.number().int().nonnegative(),
  skippedItems: z.number().int().nonnegative(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  durationMs: z.number().int().positive(),
});

export type SyncOrdersRequest = z.infer<typeof SyncOrdersRequestSchema>;
export type SyncOrdersResponse = z.infer<typeof SyncOrdersResponseSchema>;
export type OrderSyncResult = z.infer<typeof OrderSyncResultSchema>;
export type BatchSyncResult = z.infer<typeof BatchSyncResultSchema>;