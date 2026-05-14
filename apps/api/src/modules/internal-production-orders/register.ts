import type { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'

import { InternalProductionOrderRepositoryPrisma } from './infrastructure/db/internal-production-order.repository.prisma'
import { HttpProductsCatalogAdapter } from './infrastructure/integrations/http-products-catalog.adapter'
import { InternalProductionOrderAuditService } from './application/services/internal-production-order-audit.service'
import { CreateInternalProductionOrderUseCase } from './application/use-cases/create-internal-production-order.usecase'
import { UpdateInternalProductionOrderUseCase } from './application/use-cases/update-internal-production-order.usecase'
import { StartInternalProductionOrderUseCase } from './application/use-cases/start-internal-production-order.usecase'
import { CompleteInternalProductionOrderUseCase } from './application/use-cases/complete-internal-production-order.usecase'
import { GetInternalProductionOrdersUseCase } from './application/use-cases/get-internal-production-orders.usecase'
import { GetInternalProductionOrderByIdUseCase } from './application/use-cases/get-internal-production-order-by-id.usecase'
import { InternalProductionOrderController } from './presentation/http/internal-production-order.controller'
import { registerInternalProductionOrderRoutes } from './presentation/http/routes'

const CATALOG_BASE_URL = 'https://production-manager-api.onrender.com'

export async function registerInternalProductionOrdersModule(app: FastifyInstance) {
  const prisma = app.prisma as PrismaClient

  const repository = new InternalProductionOrderRepositoryPrisma(prisma)
  const productsCatalog = new HttpProductsCatalogAdapter(CATALOG_BASE_URL, app.log)
  const auditService = new InternalProductionOrderAuditService(repository, productsCatalog, app.log)

  const createUseCase = new CreateInternalProductionOrderUseCase({
    internalProductionOrderRepository: repository,
    productsCatalog,
    auditService,
    logger: app.log,
  })
  const updateUseCase = new UpdateInternalProductionOrderUseCase({
    internalProductionOrderRepository: repository,
    auditService,
    logger: app.log,
  })
  const startUseCase = new StartInternalProductionOrderUseCase({
    internalProductionOrderRepository: repository,
    auditService,
    logger: app.log,
  })
  const completeUseCase = new CompleteInternalProductionOrderUseCase({
    internalProductionOrderRepository: repository,
    auditService,
    logger: app.log,
  })
  const listUseCase = new GetInternalProductionOrdersUseCase({ internalProductionOrderRepository: repository })
  const getByIdUseCase = new GetInternalProductionOrderByIdUseCase({ internalProductionOrderRepository: repository })

  const controller = new InternalProductionOrderController(
    createUseCase,
    updateUseCase,
    startUseCase,
    completeUseCase,
    listUseCase,
    getByIdUseCase,
  )

  app.decorate('internalProductionOrderRepository', repository)
  app.decorate('createInternalProductionOrderUseCase', createUseCase)
  app.decorate('updateInternalProductionOrderUseCase', updateUseCase)
  app.decorate('startInternalProductionOrderUseCase', startUseCase)
  app.decorate('completeInternalProductionOrderUseCase', completeUseCase)
  app.decorate('getInternalProductionOrdersUseCase', listUseCase)
  app.decorate('getInternalProductionOrderByIdUseCase', getByIdUseCase)

  registerInternalProductionOrderRoutes(app, controller)
}
