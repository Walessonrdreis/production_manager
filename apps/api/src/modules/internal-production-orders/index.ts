import { FastifyInstance } from 'fastify'
import { registerInternalProductionOrdersModule } from './register'

export async function internalProductionOrdersModule(app: FastifyInstance) {
  await registerInternalProductionOrdersModule(app)
}

export { registerInternalProductionOrdersModule } from './register'
export { InternalProductionOrderRepositoryPrisma } from './infrastructure/db/internal-production-order.repository.prisma'
export { HttpProductsCatalogAdapter } from './infrastructure/integrations/http-products-catalog.adapter'

export { CreateInternalProductionOrderUseCase } from './application/use-cases/create-internal-production-order.usecase'
export { UpdateInternalProductionOrderUseCase } from './application/use-cases/update-internal-production-order.usecase'
export { StartInternalProductionOrderUseCase } from './application/use-cases/start-internal-production-order.usecase'
export { CompleteInternalProductionOrderUseCase } from './application/use-cases/complete-internal-production-order.usecase'
export { GetInternalProductionOrdersUseCase } from './application/use-cases/get-internal-production-orders.usecase'
export { GetInternalProductionOrderByIdUseCase } from './application/use-cases/get-internal-production-order-by-id.usecase'

export { InternalProductionOrderController } from './presentation/http/internal-production-order.controller'
export { registerInternalProductionOrderRoutes } from './presentation/http/routes'
export { InternalProductionOrderAuditService } from './application/services/internal-production-order-audit.service'
export { computeDiff } from './application/utils/diff'

export type { InternalProductionOrder } from './application/entities/internal-production-order.entity'
export type { InternalProductionOrderRepositoryPort } from './application/ports/internal-production-order.repository.port'
export type { ProductsCatalogPort, ProductCatalogInfo } from './application/ports/products-catalog.port'
export type { FieldChange } from './application/utils/diff'
export type {
  CreateInternalProductionOrderInput,
  UpdateInternalProductionOrderInput,
  ListInternalProductionOrdersInput,
  InternalProductionOrderOutput,
} from './application/dtos/internal-production-order.dto'
export type { CreateEventInput, CreateChangeInput } from './application/ports/internal-production-order.repository.port'
