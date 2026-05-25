import type { InternalProductionOrderRepositoryPort } from '../ports/internal-production-order.repository.port'
import type { InternalProductionOrderOutput } from '../dtos/internal-production-order.dto'
import { toOutput } from '../dtos/internal-production-order.dto'

export interface GetInternalProductionOrderByIdDependencies {
  internalProductionOrderRepository: InternalProductionOrderRepositoryPort
}

export class GetInternalProductionOrderByIdUseCase {
  constructor(private readonly deps: GetInternalProductionOrderByIdDependencies) {}

  async execute(id: string): Promise<InternalProductionOrderOutput> {
    const { internalProductionOrderRepository } = this.deps

    const existing = await internalProductionOrderRepository.findById(id)
    if (!existing) {
      throw new Error(`OP interna ${id} não encontrada`)
    }

    return toOutput(existing)
  }
}
