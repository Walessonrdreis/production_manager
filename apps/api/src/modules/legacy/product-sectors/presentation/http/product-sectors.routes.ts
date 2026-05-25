import type { FastifyInstance } from 'fastify'
import type { createProductSectorsController } from './product-sectors.controller'

export function registerProductSectorsRoutes(app: FastifyInstance, controller: ReturnType<typeof createProductSectorsController>) {
  const prefix = '/v1/product-sectors'

  app.get(`${prefix}`, controller.list.bind(controller))
  app.put(`${prefix}/:id`, controller.update.bind(controller))
  app.delete(`${prefix}/:id`, controller.delete.bind(controller))
}
