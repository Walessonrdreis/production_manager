import { z } from 'zod'
import type { InternalProductionOrder } from '../entities/internal-production-order.entity'

export const CreateInternalProductionOrderSchema = z.object({
  lote: z.string().min(1).max(64),
  quantityValue: z.number().positive(),
  quantityUnit: z.enum(['UN', 'B', 'G', 'KG']).default('UN'),
  omieCode: z.string().max(64).optional().nullable(),
  parsedProductName: z.string().max(512).optional().nullable(),
  productDescription: z.string().optional().nullable(),
  stockQuantity: z.number().optional().nullable(),
  minimumStock: z.number().optional().nullable(),
  source: z.enum(['MANUAL', 'TRELLO']).default('MANUAL'),
  trelloCardId: z.string().max(128).optional().nullable(),
  trelloCardUrl: z.string().max(1024).optional().nullable(),
})
export type CreateInternalProductionOrderInput = z.infer<typeof CreateInternalProductionOrderSchema>

export const UpdateInternalProductionOrderSchema = z.object({
  lote: z.string().min(1).max(64).optional(),
  quantityValue: z.number().positive().optional(),
  quantityUnit: z.enum(['UN', 'B', 'G', 'KG']).optional(),
  omieCode: z.string().max(64).optional().nullable(),
  parsedProductName: z.string().max(512).optional().nullable(),
  productDescription: z.string().optional().nullable(),
  stockQuantity: z.number().optional().nullable(),
  minimumStock: z.number().optional().nullable(),
})
export type UpdateInternalProductionOrderInput = z.infer<typeof UpdateInternalProductionOrderSchema>

export const ListInternalProductionOrdersSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']).optional(),
  source: z.enum(['MANUAL', 'TRELLO']).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
})
export type ListInternalProductionOrdersInput = z.infer<typeof ListInternalProductionOrdersSchema>

export interface InternalProductionOrderOutput {
  id: string
  trelloCardId: string | null
  trelloCardUrl: string | null
  source: string
  status: string
  lote: string
  quantityValue: number
  quantityUnit: string
  omieCode: string | null
  parsedProductName: string | null
  productDescription: string | null
  stockQuantity: number | null
  minimumStock: number | null
  startedAt: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export function toOutput(order: InternalProductionOrder): InternalProductionOrderOutput {
  return {
    id: order.id,
    trelloCardId: order.trelloCardId,
    trelloCardUrl: order.trelloCardUrl,
    source: order.source,
    status: order.status,
    lote: order.lote,
    quantityValue: Number(order.quantityValue),
    quantityUnit: order.quantityUnit,
    omieCode: order.omieCode,
    parsedProductName: order.parsedProductName,
    productDescription: order.productDescription,
    stockQuantity: order.stockQuantity != null ? Number(order.stockQuantity) : null,
    minimumStock: order.minimumStock != null ? Number(order.minimumStock) : null,
    startedAt: order.startedAt?.toISOString() ?? null,
    completedAt: order.completedAt?.toISOString() ?? null,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  }
}
