import type { InternalProductionOrderRepositoryPort } from '../ports/internal-production-order.repository.port'
import type { AuditLogger } from '../services/internal-production-order-audit.service'

export interface DeleteInternalProductionOrderDependencies {
  internalProductionOrderRepository: InternalProductionOrderRepositoryPort
  logger?: AuditLogger
}

export class DeleteInternalProductionOrderUseCase {
  constructor(private readonly deps: DeleteInternalProductionOrderDependencies) {}

  async execute(id: string): Promise<void> {
    const { internalProductionOrderRepository, logger } = this.deps

    const existing = await internalProductionOrderRepository.findById(id)
    if (!existing) {
      throw new Error(`OP interna ${id} não encontrada`)
    }

    await internalProductionOrderRepository.delete(id)
    logger?.info('OP interna deletada', { id })
  }
}
