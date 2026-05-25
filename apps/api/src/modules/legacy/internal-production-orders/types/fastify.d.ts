import 'fastify'

import type { InternalProductionOrderRepositoryPort } from '../application/ports/internal-production-order.repository.port'
import type { CreateInternalProductionOrderUseCase } from '../application/use-cases/create-internal-production-order.usecase'
import type { UpdateInternalProductionOrderUseCase } from '../application/use-cases/update-internal-production-order.usecase'
import type { StartInternalProductionOrderUseCase } from '../application/use-cases/start-internal-production-order.usecase'
import type { CompleteInternalProductionOrderUseCase } from '../application/use-cases/complete-internal-production-order.usecase'
import type { GetInternalProductionOrdersUseCase } from '../application/use-cases/get-internal-production-orders.usecase'
import type { GetInternalProductionOrderByIdUseCase } from '../application/use-cases/get-internal-production-order-by-id.usecase'

declare module 'fastify' {
  interface FastifyInstance {
    internalProductionOrderRepository: InternalProductionOrderRepositoryPort
    createInternalProductionOrderUseCase: CreateInternalProductionOrderUseCase
    updateInternalProductionOrderUseCase: UpdateInternalProductionOrderUseCase
    startInternalProductionOrderUseCase: StartInternalProductionOrderUseCase
    completeInternalProductionOrderUseCase: CompleteInternalProductionOrderUseCase
    getInternalProductionOrdersUseCase: GetInternalProductionOrdersUseCase
    getInternalProductionOrderByIdUseCase: GetInternalProductionOrderByIdUseCase
  }
}
