import { z } from "zod";

/**
 * Schema de validação para requisição de sincronização de estoque
 */
export const SyncStockRequestSchema = z.object({
  forceRefresh: z.boolean().optional().default(false),
  productCodes: z.array(z.string()).optional(),
  batchSize: z.number().int().positive().max(1000).optional().default(100),
});

/**
 * Tipo para requisição de sincronização de estoque
 */
export type SyncStockRequest = z.infer<typeof SyncStockRequestSchema>;

/**
 * Schema de validação para resposta de sincronização de estoque
 */
export const SyncStockResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    totalProducts: z.number().int().nonnegative(),
    syncedProducts: z.number().int().nonnegative(),
    failedProducts: z.number().int().nonnegative(),
    durationMs: z.number().int().positive(),
  }),
  timestamp: z.string().datetime(),
});

/**
 * Tipo para resposta de sincronização de estoque
 */
export type SyncStockResponse = z.infer<typeof SyncStockResponseSchema>;

/**
 * Dados de estoque de um produto
 */
export interface ProductStockData {
  productCode: string;
  productName: string;
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  lastUpdated: Date;
  isCritical: boolean;
}

/**
 * Resultado da sincronização de estoque
 */
export interface SyncStockResult {
  totalProducts: number;
  syncedProducts: number;
  failedProducts: number;
  durationMs: number;
  criticalProducts: ProductStockData[];
  errors: Array<{
    productCode: string;
    error: string;
  }>;
}