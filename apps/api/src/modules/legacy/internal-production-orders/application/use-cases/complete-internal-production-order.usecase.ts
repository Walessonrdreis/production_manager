import type { InternalProductionOrderRepositoryPort } from '../ports/internal-production-order.repository.port'
import type { InternalProductionOrderAuditService, AuditLogger } from '../services/internal-production-order-audit.service'
import type { InternalProductionOrderOutput } from '../dtos/internal-production-order.dto'
import { toOutput } from '../dtos/internal-production-order.dto'

export interface CompleteInternalProductionOrderDependencies {
  internalProductionOrderRepository: InternalProductionOrderRepositoryPort
  auditService: InternalProductionOrderAuditService
  logger?: AuditLogger
}

export class CompleteInternalProductionOrderUseCase {
  constructor(private readonly deps: CompleteInternalProductionOrderDependencies) {}

  async execute(
    id: string,
    actorType: 'SYSTEM' | 'INTEGRATION' | 'USER' = 'SYSTEM',
    actorId: string | null = null,
  ): Promise<InternalProductionOrderOutput> {
    const { internalProductionOrderRepository, auditService, logger } = this.deps

    const before = await internalProductionOrderRepository.findById(id)
    if (!before) {
      throw new Error(`OP interna ${id} não encontrada`)
    }
    if (before.status !== 'IN_PROGRESS') {
      throw new Error(`OP interna ${id} não pode ser concluída. Status atual: ${before.status}`)
    }

    const updated = await internalProductionOrderRepository.complete(id)
    logger?.info('OP interna concluída', { id })

    await auditService.recordEventFromDiff(
      id,
      'COMPLETED',
      actorType,
      actorId,
      'SYSTEM',
      `OP interna concluída`,
      { status: before.status, completedAt: before.completedAt },
      { status: updated.status, completedAt: updated.completedAt },
    )

    return toOutput(updated)
  }
}
