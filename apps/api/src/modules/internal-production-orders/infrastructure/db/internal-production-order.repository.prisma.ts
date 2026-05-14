import { PrismaClient } from '@prisma/client'
import type { InternalProductionOrder as PrismaInternalProductionOrder } from '@prisma/client'
import type { InternalProductionOrder as InternalProductionOrderEntity } from '../../application/entities/internal-production-order.entity'
import type { InternalProductionOrderRepositoryPort, CreateEventInput, CreateChangeInput } from '../../application/ports/internal-production-order.repository.port'
import type { CreateInternalProductionOrderInput, UpdateInternalProductionOrderInput, ListInternalProductionOrdersInput } from '../../application/dtos/internal-production-order.dto'

function mapToDomain(record: PrismaInternalProductionOrder): InternalProductionOrderEntity {
  return {
    id: record.id,
    trelloCardId: record.trelloCardId,
    trelloCardUrl: record.trelloCardUrl,
    source: record.source as InternalProductionOrderEntity['source'],
    status: record.status as InternalProductionOrderEntity['status'],
    lote: record.lote,
    quantityValue: Number(record.quantityValue),
    quantityUnit: record.quantityUnit as InternalProductionOrderEntity['quantityUnit'],
    omieCode: record.omieCode,
    parsedProductName: record.parsedProductName,
    productDescription: record.productDescription,
    stockQuantity: record.stockQuantity ? Number(record.stockQuantity) : null,
    minimumStock: record.minimumStock ? Number(record.minimumStock) : null,
    startedAt: record.startedAt,
    completedAt: record.completedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  }
}

export class InternalProductionOrderRepositoryPrisma implements InternalProductionOrderRepositoryPort {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateInternalProductionOrderInput): Promise<InternalProductionOrderEntity> {
    const record = await this.prisma.internalProductionOrder.create({
      data: {
        lote: data.lote,
        quantityValue: data.quantityValue,
        quantityUnit: data.quantityUnit ?? 'UN',
        omieCode: data.omieCode ?? null,
        parsedProductName: data.parsedProductName ?? null,
        productDescription: data.productDescription ?? null,
        stockQuantity: data.stockQuantity ?? null,
        minimumStock: data.minimumStock ?? null,
        source: data.source ?? 'MANUAL',
        trelloCardId: data.trelloCardId ?? null,
        trelloCardUrl: data.trelloCardUrl ?? null,
      },
    })
    return mapToDomain(record)
  }

  async update(id: string, data: UpdateInternalProductionOrderInput): Promise<InternalProductionOrderEntity> {
    const record = await this.prisma.internalProductionOrder.update({
      where: { id },
      data: {
        ...(data.lote !== undefined && { lote: data.lote }),
        ...(data.quantityValue !== undefined && { quantityValue: data.quantityValue }),
        ...(data.quantityUnit !== undefined && { quantityUnit: data.quantityUnit }),
        ...(data.omieCode !== undefined && { omieCode: data.omieCode }),
        ...(data.parsedProductName !== undefined && { parsedProductName: data.parsedProductName }),
        ...(data.productDescription !== undefined && { productDescription: data.productDescription }),
        ...(data.stockQuantity !== undefined && { stockQuantity: data.stockQuantity }),
        ...(data.minimumStock !== undefined && { minimumStock: data.minimumStock }),
      },
    })
    return mapToDomain(record)
  }

  async start(id: string): Promise<InternalProductionOrderEntity> {
    const record = await this.prisma.internalProductionOrder.update({
      where: { id },
      data: { status: 'IN_PROGRESS', startedAt: new Date() },
    })
    return mapToDomain(record)
  }

  async complete(id: string): Promise<InternalProductionOrderEntity> {
    const record = await this.prisma.internalProductionOrder.update({
      where: { id },
      data: { status: 'COMPLETED', completedAt: new Date() },
    })
    return mapToDomain(record)
  }

  async findById(id: string): Promise<InternalProductionOrderEntity | null> {
    const record = await this.prisma.internalProductionOrder.findUnique({ where: { id } })
    return record ? mapToDomain(record) : null
  }

  async findByTrelloCardId(trelloCardId: string): Promise<InternalProductionOrderEntity | null> {
    const record = await this.prisma.internalProductionOrder.findUnique({ where: { trelloCardId } })
    return record ? mapToDomain(record) : null
  }

  async list(params: ListInternalProductionOrdersInput): Promise<{ items: InternalProductionOrderEntity[]; total: number }> {
    const { page = 1, pageSize = 20, status, source, dateFrom, dateTo } = params
    const skip = (page - 1) * pageSize

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (source) where.source = source
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) (where.createdAt as Record<string, unknown>).gte = new Date(dateFrom)
      if (dateTo) (where.createdAt as Record<string, unknown>).lte = new Date(dateTo)
    }

    const [records, total] = await Promise.all([
      this.prisma.internalProductionOrder.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.internalProductionOrder.count({ where }),
    ])

    return { items: records.map(mapToDomain), total }
  }

  async delete(id: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.internalProductionOrderChange.deleteMany({
        where: { event: { orderId: id } },
      })
      await tx.internalProductionOrderEvent.deleteMany({
        where: { orderId: id },
      })
      await tx.internalProductionOrder.delete({ where: { id } })
    })
  }

  async createEventWithChanges(event: CreateEventInput, changes: CreateChangeInput[]): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const createdEvent = await tx.internalProductionOrderEvent.create({
        data: {
          orderId: event.orderId,
          type: event.type,
          actorType: event.actorType,
          actorId: event.actorId,
          source: event.source,
          message: event.message,
        },
      })

      if (changes.length > 0) {
        await tx.internalProductionOrderChange.createMany({
          data: changes.map((c) => ({
            eventId: createdEvent.id,
            field: c.field,
            before: c.before,
            after: c.after,
          })),
        })
      }
    })
  }
}
