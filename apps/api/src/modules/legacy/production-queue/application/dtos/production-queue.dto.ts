import { z } from "zod";

// Request para adicionar ordem à fila de produção
export const AddToQueueRequestSchema = z.object({
  orderId: z.string().uuid(),
  priority: z.enum(["high", "medium", "low"]).optional().default("medium"),
  scheduledDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export type AddToQueueRequest = z.infer<typeof AddToQueueRequestSchema>;

// Response para adição à fila
export const AddToQueueResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    id: z.string().uuid(),
    orderId: z.string().uuid(),
    priority: z.enum(["high", "medium", "low"]),
    status: z.enum(["pending", "in_progress", "completed", "cancelled"]),
    position: z.number().int().positive(),
    estimatedStartDate: z.string().datetime().optional(),
    scheduledDate: z.string().datetime().optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }),
  message: z.string(),
});

export type AddToQueueResponse = z.infer<typeof AddToQueueResponseSchema>;

// Request para listar fila de produção
export const ListQueueRequestSchema = z.object({
  page: z.number().int().positive().optional().default(1),
  pageSize: z.number().int().positive().max(100).optional().default(20),
  status: z.enum(["pending", "in_progress", "completed", "cancelled"]).optional(),
  priority: z.enum(["high", "medium", "low"]).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

export type ListQueueRequest = z.infer<typeof ListQueueRequestSchema>;

// Response para listagem da fila
export const ListQueueResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    items: z.array(z.object({
      id: z.string().uuid(),
      orderId: z.string().uuid(),
      orderNumber: z.string(),
      clientName: z.string(),
      totalItems: z.number().int().positive(),
      priority: z.enum(["high", "medium", "low"]),
      status: z.enum(["pending", "in_progress", "completed", "cancelled"]),
      position: z.number().int().positive(),
      estimatedStartDate: z.string().datetime().optional(),
      scheduledDate: z.string().datetime().optional(),
      createdAt: z.string().datetime(),
      updatedAt: z.string().datetime(),
    })),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    statistics: z.object({
      pending: z.number().int().nonnegative(),
      in_progress: z.number().int().nonnegative(),
      completed: z.number().int().nonnegative(),
      cancelled: z.number().int().nonnegative(),
      high: z.number().int().nonnegative(),
      medium: z.number().int().nonnegative(),
      low: z.number().int().nonnegative(),
    }),
  }),
  message: z.string(),
});

export type ListQueueResponse = z.infer<typeof ListQueueResponseSchema>;

// Request para atualizar status da fila
export const UpdateQueueStatusRequestSchema = z.object({
  status: z.enum(["in_progress", "completed", "cancelled"]),
  notes: z.string().optional(),
  completedAt: z.string().datetime().optional(),
});

export type UpdateQueueStatusRequest = z.infer<typeof UpdateQueueStatusRequestSchema>;

// Response para atualização de status
export const UpdateQueueStatusResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    id: z.string().uuid(),
    status: z.enum(["pending", "in_progress", "completed", "cancelled"]),
    updatedAt: z.string().datetime(),
    completedAt: z.string().datetime().optional(),
  }),
  message: z.string(),
});

export type UpdateQueueStatusResponse = z.infer<typeof UpdateQueueStatusResponseSchema>;

// Request para obter estatísticas da fila
export const QueueStatisticsRequestSchema = z.object({
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

export type QueueStatisticsRequest = z.infer<typeof QueueStatisticsRequestSchema>;

// Response para estatísticas da fila
export const QueueStatisticsResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    totalOrders: z.number().int().nonnegative(),
    pendingOrders: z.number().int().nonnegative(),
    inProgressOrders: z.number().int().nonnegative(),
    completedOrders: z.number().int().nonnegative(),
    cancelledOrders: z.number().int().nonnegative(),
    averageCompletionTime: z.number().nonnegative().optional(),
    priorityDistribution: z.object({
      high: z.number().int().nonnegative(),
      medium: z.number().int().nonnegative(),
      low: z.number().int().nonnegative(),
    }),
    dailyThroughput: z.array(z.object({
      date: z.string().date(),
      completed: z.number().int().nonnegative(),
    })).optional(),
  }),
  message: z.string(),
});

export type QueueStatisticsResponse = z.infer<typeof QueueStatisticsResponseSchema>;

// Request para reordenar fila
export const ReorderQueueRequestSchema = z.object({
  items: z.array(z.object({
    id: z.string().uuid(),
    newPosition: z.number().int().positive(),
  })),
});

export type ReorderQueueRequest = z.infer<typeof ReorderQueueRequestSchema>;

// Response para reordenação
export const ReorderQueueResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    updatedItems: z.number().int().nonnegative(),
  }),
  message: z.string(),
});

export type ReorderQueueResponse = z.infer<typeof ReorderQueueResponseSchema>;