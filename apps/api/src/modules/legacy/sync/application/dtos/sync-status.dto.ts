import { z } from "zod";

export const SyncStatusRequestSchema = z.object({
  syncType: z.enum(["all", "stock", "orders", "production"]).optional().default("all"),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  limit: z.number().int().positive().max(100).optional().default(20),
});

export const SyncStatusResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    summary: z.object({
      totalSyncs: z.number().int().nonnegative(),
      successfulSyncs: z.number().int().nonnegative(),
      failedSyncs: z.number().int().nonnegative(),
      averageDurationMs: z.number().int().nonnegative(),
      lastSyncAt: z.string().datetime().optional(),
      nextSyncAt: z.string().datetime().optional(),
    }),
    recentSyncs: z.array(
      z.object({
        id: z.string(),
        syncType: z.enum(["stock", "orders", "production"]),
        status: z.enum(["success", "failed", "in_progress"]),
        startedAt: z.string().datetime(),
        completedAt: z.string().datetime().optional(),
        durationMs: z.number().int().nonnegative().optional(),
        itemsProcessed: z.number().int().nonnegative(),
        itemsFailed: z.number().int().nonnegative(),
        error: z.string().optional(),
      })
    ),
    syncStatsByType: z.record(
      z.enum(["stock", "orders", "production"]),
      z.object({
        totalSyncs: z.number().int().nonnegative(),
        successfulSyncs: z.number().int().nonnegative(),
        failedSyncs: z.number().int().nonnegative(),
        averageDurationMs: z.number().int().nonnegative(),
        lastSyncAt: z.string().datetime().optional(),
      })
    ),
  }),
  timestamp: z.string().datetime(),
});

export const SyncStatusSummarySchema = z.object({
  syncType: z.enum(["stock", "orders", "production"]),
  totalSyncs: z.number().int().nonnegative(),
  successfulSyncs: z.number().int().nonnegative(),
  failedSyncs: z.number().int().nonnegative(),
  averageDurationMs: z.number().int().nonnegative(),
  lastSyncAt: z.string().datetime().optional(),
  nextSyncAt: z.string().datetime().optional(),
});

export type SyncStatusRequest = z.infer<typeof SyncStatusRequestSchema>;
export type SyncStatusResponse = z.infer<typeof SyncStatusResponseSchema>;
export type SyncStatusSummary = z.infer<typeof SyncStatusSummarySchema>;