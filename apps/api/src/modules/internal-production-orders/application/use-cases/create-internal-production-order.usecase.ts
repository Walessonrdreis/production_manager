import type { InternalProductionOrderRepositoryPort } from '../ports/internal-production-order.repository.port'
import type { ProductsCatalogPort } from '../ports/products-catalog.port'
import type { InternalProductionOrderAuditService, AuditLogger } from '../services/internal-production-order-audit.service'
import type { CreateInternalProductionOrderInput, InternalProductionOrderOutput } from '../dtos/internal-production-order.dto'
import { CreateInternalProductionOrderSchema, toOutput } from '../dtos/internal-production-order.dto'

export interface CreateInternalProductionOrderDependencies {
  internalProductionOrderRepository: InternalProductionOrderRepositoryPort
  productsCatalog: ProductsCatalogPort
  auditService: InternalProductionOrderAuditService
  logger?: AuditLogger
}

export class CreateInternalProductionOrderUseCase {
  constructor(private readonly deps: CreateInternalProductionOrderDependencies) {}

  async execute(
    input: CreateInternalProductionOrderInput,
    actorType: 'SYSTEM' | 'INTEGRATION' | 'USER' = 'SYSTEM',
    actorId: string | null = null,
  ): Promise<InternalProductionOrderOutput> {
    const { internalProductionOrderRepository, auditService, logger } = this.deps
    const validated = CreateInternalProductionOrderSchema.parse(input)

    if (validated.trelloCardId) {
      const existing = await internalProductionOrderRepository.findByTrelloCardId(validated.trelloCardId)
      if (existing) {
        throw new Error(`OP interna com trelloCardId ${validated.trelloCardId} já existe`)
      }
    }

    const created = await internalProductionOrderRepository.create(validated)
    logger?.info('OP interna criada', { id: created.id, lote: created.lote })

    await auditService.recordEvent(
      created.id,
      'CREATED',
      actorType,
      actorId,
      validated.source === 'TRELLO' ? 'TRELLO' : 'MANUAL',
      `OP interna criada via ${validated.source}`,
    )

    const enriched = await auditService.enrichFromCatalog(created, actorType, actorId, 'SYSTEM')

    return toOutput(enriched)
  }
}
