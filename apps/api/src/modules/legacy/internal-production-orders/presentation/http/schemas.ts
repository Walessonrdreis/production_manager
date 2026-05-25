import { CreateInternalProductionOrderSchema, UpdateInternalProductionOrderSchema, ListInternalProductionOrdersSchema } from '../../application/dtos/internal-production-order.dto'
import type { InternalProductionOrderOutput } from '../../application/dtos/internal-production-order.dto'

export const InternalProductionOrderBodySchema = CreateInternalProductionOrderSchema
export const InternalProductionOrderUpdateBodySchema = UpdateInternalProductionOrderSchema
export const InternalProductionOrderQuerySchema = ListInternalProductionOrdersSchema

export const InternalProductionOrderResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    data: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        trelloCardId: { type: 'string', nullable: true },
        trelloCardUrl: { type: 'string', nullable: true },
        source: { type: 'string', enum: ['MANUAL', 'TRELLO'] },
        status: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'] },
        lote: { type: 'string' },
        quantityValue: { type: 'number' },
        quantityUnit: { type: 'string', enum: ['UN', 'B', 'G', 'KG'] },
        omieCode: { type: 'string', nullable: true },
        parsedProductName: { type: 'string', nullable: true },
        productDescription: { type: 'string', nullable: true },
        stockQuantity: { type: 'number', nullable: true },
        minimumStock: { type: 'number', nullable: true },
        startedAt: { type: 'string', format: 'date-time', nullable: true },
        completedAt: { type: 'string', format: 'date-time', nullable: true },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  },
}

export const InternalProductionOrderListResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    items: {
      type: 'array',
      items: { $ref: '#/definitions/InternalProductionOrderOutput' },
    },
    total: { type: 'integer' },
  },
}

export const InternalProductionOrderErrorSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    error: { type: 'string' },
    details: { type: 'array', nullable: true },
  },
}

export type { InternalProductionOrderOutput }
