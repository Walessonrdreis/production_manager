import type { InternalProductionOrderRepositoryPort } from '../ports/internal-production-order.repository.port'
import type { InternalProductionOrderAuditService, AuditLogger } from '../services/internal-production-order-audit.service'
import type { UpdateInternalProductionOrderInput, InternalProductionOrderOutput } from '../dtos/internal-production-order.dto'
import { UpdateInternalProductionOrderSchema, toOutput } from '../dtos/internal-production-order.dto'

export interface UpdateInternalProductionOrderDependencies {
  internalProductionOrderRepository: InternalProductionOrderRepositoryPort
  auditService: InternalProductionOrderAuditService
  logger?: AuditLogger
}

export class UpdateInternalProductionOrderUseCase {
  constructor(private readonly deps: UpdateInternalProductionOrderDependencies) {}

  async execute(
    id: string,
    input: UpdateInternalProductionOrderInput,
    actorType: 'SYSTEM' | 'INTEGRATION' | 'USER' = 'SYSTEM',
    actorId: string | null = null,
  ): Promise<InternalProductionOrderOutput> {
    const { internalProductionOrderRepository, auditService, logger } = this.deps
    const validated = UpdateInternalProductionOrderSchema.parse(input)

    const before = await internalProductionOrderRepository.findById(id)
    if (!before) {
      throw new Error(`OP interna ${id} não encontrada`)
    }

    const updated = await internalProductionOrderRepository.update(id, validated)
    logger?.info('OP interna atualizada', { id })

    await auditService.recordEventFromDiff(
      id,
      'UPDATED',
      actorType,
      actorId,
      'SYSTEM',
      `OP interna atualizada`,
      before as unknown as Record<string, unknown>,
      updated as unknown as Record<string, unknown>,
    )

    if (updated.omieCode) {
      const enriched = await auditService.enrichFromCatalog(updated, actorType, actorId, 'SYSTEM')
      return toOutput(enriched)
    }

    return toOutput(updated)
  }
}
