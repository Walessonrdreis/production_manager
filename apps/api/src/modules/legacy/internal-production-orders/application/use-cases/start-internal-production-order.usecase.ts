import type { InternalProductionOrderRepositoryPort } from '../ports/internal-production-order.repository.port'
import type { InternalProductionOrderAuditService, AuditLogger } from '../services/internal-production-order-audit.service'
import type { InternalProductionOrderOutput } from '../dtos/internal-production-order.dto'
import { toOutput } from '../dtos/internal-production-order.dto'

export interface StartInternalProductionOrderDependencies {
  internalProductionOrderRepository: InternalProductionOrderRepositoryPort
  auditService: InternalProductionOrderAuditService
  logger?: AuditLogger
}

export class StartInternalProductionOrderUseCase {
  constructor(private readonly deps: StartInternalProductionOrderDependencies) {}

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
    if (before.status !== 'PENDING') {
      throw new Error(`OP interna ${id} não pode ser iniciada. Status atual: ${before.status}`)
    }

    const updated = await internalProductionOrderRepository.start(id)
    logger?.info('OP interna iniciada', { id })

    await auditService.recordEventFromDiff(
      id,
      'STARTED',
      actorType,
      actorId,
      'SYSTEM',
      `OP interna iniciada`,
      { status: before.status, startedAt: before.startedAt },
      { status: updated.status, startedAt: updated.startedAt },
    )

    return toOutput(updated)
  }
}
