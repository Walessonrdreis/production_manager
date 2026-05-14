import type { InternalProductionOrderRepositoryPort, CreateChangeInput } from '../ports/internal-production-order.repository.port'
import type { ProductsCatalogPort } from '../ports/products-catalog.port'
import type { InternalProductionOrder, InternalProductionOrderActorType, InternalProductionOrderEventSource } from '../entities/internal-production-order.entity'
import { computeDiff } from '../utils/diff'
import type { UpdateInternalProductionOrderInput } from '../dtos/internal-production-order.dto'

export interface AuditLogger {
  info: (msg: string, data?: unknown) => void
  error: (msg: string, data?: unknown) => void
}

export class InternalProductionOrderAuditService {
  constructor(
    private readonly repository: InternalProductionOrderRepositoryPort,
    private readonly catalog: ProductsCatalogPort,
    private readonly logger?: AuditLogger,
  ) {}

  async recordEvent(
    orderId: string,
    type: string,
    actorType: InternalProductionOrderActorType,
    actorId: string | null,
    source: InternalProductionOrderEventSource,
    message: string,
    changes: CreateChangeInput[] = [],
  ): Promise<void> {
    await this.repository.createEventWithChanges(
      { orderId, type, actorType, actorId, source, message },
      changes,
    )
    this.logger?.info(`Audit: ${type}`, { orderId, actorType, changesCount: changes.length })
  }

  async recordEventFromDiff(
    orderId: string,
    type: string,
    actorType: InternalProductionOrderActorType,
    actorId: string | null,
    source: InternalProductionOrderEventSource,
    message: string,
    before: Record<string, unknown>,
    after: Record<string, unknown>,
  ): Promise<void> {
    const changes = computeDiff(before, after)
    if (changes.length === 0) {
      this.logger?.info('Audit: diff vazio, evento não gerado', { orderId, type })
      return
    }

    await this.recordEvent(orderId, type, actorType, actorId, source, message, changes)
  }

  async enrichFromCatalog(
    order: InternalProductionOrder,
    actorType: InternalProductionOrderActorType,
    actorId: string | null,
    source: InternalProductionOrderEventSource,
  ): Promise<InternalProductionOrder> {
    if (!order.omieCode) {
      await this.recordEvent(
        order.id,
        'LOOKUP_SKIPPED_NO_CODE',
        actorType,
        actorId,
        source,
        'OP interna sem omieCode, enriquecimento ignorado',
      )
      return order
    }

    const product = await this.catalog.findByOmieCode(order.omieCode)
    if (!product) {
      await this.recordEvent(
        order.id,
        'PRODUCT_NOT_FOUND',
        actorType,
        actorId,
        source,
        `Produto com omieCode ${order.omieCode} não encontrado no catálogo`,
      )
      return order
    }

    const updateInput: UpdateInternalProductionOrderInput = {
      productDescription: product.productDescription,
      stockQuantity: product.stockQuantity,
      minimumStock: product.minimumStock,
    }

    const updated = await this.repository.update(order.id, updateInput)

    await this.recordEventFromDiff(
      order.id,
      'ENRICHED_FROM_OMIECODE',
      actorType,
      actorId,
      source,
      `OP enriquecida com dados do catálogo para omieCode ${order.omieCode}`,
      {
        productDescription: order.productDescription,
        stockQuantity: order.stockQuantity,
        minimumStock: order.minimumStock,
      },
      {
        productDescription: updated.productDescription,
        stockQuantity: updated.stockQuantity,
        minimumStock: updated.minimumStock,
      },
    )

    return updated
  }
}
