import { FastifyInstance } from 'fastify'
import { InternalProductionOrderController } from './internal-production-order.controller'

export function registerInternalProductionOrderRoutes(app: FastifyInstance, controller: InternalProductionOrderController) {
  app.post('/v1/internal-production-orders', controller.create.bind(controller))
  app.get('/v1/internal-production-orders', controller.list.bind(controller))
  app.get('/v1/internal-production-orders/:id', controller.getById.bind(controller))
  app.patch('/v1/internal-production-orders/:id', controller.update.bind(controller))
  app.post('/v1/internal-production-orders/:id/start', controller.start.bind(controller))
  app.post('/v1/internal-production-orders/:id/complete', controller.complete.bind(controller))
  app.patch('/v1/internal-production-orders/:id/start', controller.start.bind(controller))
  app.patch('/v1/internal-production-orders/:id/complete', controller.complete.bind(controller))
  app.delete('/v1/internal-production-orders/:id', controller.delete.bind(controller))
}
