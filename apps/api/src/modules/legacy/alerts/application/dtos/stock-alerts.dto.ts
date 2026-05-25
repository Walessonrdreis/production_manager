import { z } from "zod";

// Request para listar alertas de estoque crítico
export const StockAlertsRequestSchema = z.object({
  page: z.number().int().positive().optional().default(1),
  pageSize: z.number().int().positive().max(100).optional().default(20),
  severity: z.enum(["critical", "warning", "info"]).optional(),
  resolved: z.boolean().optional(),
  productCode: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

export type StockAlertsRequest = z.infer<typeof StockAlertsRequestSchema>;

// Response para alertas de estoque crítico
export const StockAlertsResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    alerts: z.array(z.object({
      id: z.string().uuid(),
      productCode: z.string(),
      productDescription: z.string(),
      currentStock: z.number().nonnegative(),
      minimumStock: z.number().nonnegative(),
      severity: z.enum(["critical", "warning", "info"]),
      status: z.enum(["active", "resolved", "acknowledged"]),
      createdAt: z.string().datetime(),
      resolvedAt: z.string().datetime().optional(),
      metadata: z.record(z.any()).optional(),
    })),
    pagination: z.object({
      page: z.number().int().positive(),
      pageSize: z.number().int().positive(),
      totalItems: z.number().int().nonnegative(),
      totalPages: z.number().int().positive(),
    }),
    summary: z.object({
      criticalCount: z.number().int().nonnegative(),
      warningCount: z.number().int().nonnegative(),
      infoCount: z.number().int().nonnegative(),
      activeCount: z.number().int().nonnegative(),
      resolvedCount: z.number().int().nonnegative(),
    }),
  }),
  timestamp: z.string().datetime(),
});

export type StockAlertsResponse = z.infer<typeof StockAlertsResponseSchema>;

// Request para configurar limites de alerta
export const AlertConfigRequestSchema = z.object({
  productCode: z.string().optional(), // Se não especificado, aplica a todos
  criticalThreshold: z.number().positive().optional(),
  warningThreshold: z.number().positive().optional(),
  notificationChannels: z.array(z.enum(["email", "sms", "dashboard"])).optional(),
  autoResolveDays: z.number().int().positive().optional(),
});

export type AlertConfigRequest = z.infer<typeof AlertConfigRequestSchema>;

// Response para configuração de alerta
export const AlertConfigResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    id: z.string().uuid(),
    productCode: z.string().optional(),
    criticalThreshold: z.number().positive(),
    warningThreshold: z.number().positive(),
    notificationChannels: z.array(z.enum(["email", "sms", "dashboard"])),
    autoResolveDays: z.number().int().positive(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }),
  timestamp: z.string().datetime(),
});

export type AlertConfigResponse = z.infer<typeof AlertConfigResponseSchema>;

// Request para atualizar status de alerta
export const AlertStatusRequestSchema = z.object({
  status: z.enum(["resolved", "acknowledged"]),
  notes: z.string().optional(),
});

export type AlertStatusRequest = z.infer<typeof AlertStatusRequestSchema>;

// Response para atualização de status
export const AlertStatusResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    id: z.string().uuid(),
    status: z.enum(["resolved", "acknowledged"]),
    resolvedAt: z.string().datetime().optional(),
    notes: z.string().optional(),
    updatedAt: z.string().datetime(),
  }),
  timestamp: z.string().datetime(),
});

export type AlertStatusResponse = z.infer<typeof AlertStatusResponseSchema>;