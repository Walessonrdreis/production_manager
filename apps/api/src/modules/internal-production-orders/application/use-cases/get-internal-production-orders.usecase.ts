import type { InternalProductionOrderRepositoryPort } from '../ports/internal-production-order.repository.port'
import type { InternalProductionOrderOutput, ListInternalProductionOrdersInput } from '../dtos/internal-production-order.dto'
import { ListInternalProductionOrdersSchema, toOutput } from '../dtos/internal-production-order.dto'

export interface GetInternalProductionOrdersDependencies {
  internalProductionOrderRepository: InternalProductionOrderRepositoryPort
}

export class GetInternalProductionOrdersUseCase {
  constructor(private readonly deps: GetInternalProductionOrdersDependencies) {}

  async execute(input: ListInternalProductionOrdersInput): Promise<{ items: InternalProductionOrderOutput[]; total: number }> {
    const { internalProductionOrderRepository } = this.deps
    const validated = ListInternalProductionOrdersSchema.parse(input)

    const result = await internalProductionOrderRepository.list(validated)

    return {
      items: result.items.map(toOutput),
      total: result.total,
    }
  }
}
