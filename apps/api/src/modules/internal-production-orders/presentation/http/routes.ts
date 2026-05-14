import { FastifyInstance } from 'fastify'
import { InternalProductionOrderController } from './internal-production-order.controller'

export function registerInternalProductionOrderRoutes(app: FastifyInstance, controller: InternalProductionOrderController) {
  app.post('/api/internal-production-orders', controller.create.bind(controller))
  app.get('/api/internal-production-orders', controller.list.bind(controller))
  app.get('/api/internal-production-orders/:id', controller.getById.bind(controller))
  app.patch('/api/internal-production-orders/:id', controller.update.bind(controller))
  app.post('/api/internal-production-orders/:id/start', controller.start.bind(controller))
  app.post('/api/internal-production-orders/:id/complete', controller.complete.bind(controller))
  app.patch('/api/internal-production-orders/:id/start', controller.start.bind(controller))
  app.patch('/api/internal-production-orders/:id/complete', controller.complete.bind(controller))
  app.delete('/api/internal-production-orders/:id', controller.delete.bind(controller))
}
