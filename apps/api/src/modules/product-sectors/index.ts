// AUTO-GENERATED: module-scaffold
import { FastifyInstance } from 'fastify'
import { productSectorsRoutes } from './presentation/http/routes'

export async function productSectorsModule(app: FastifyInstance) {
  /**
   * Composição do módulo product-sectors (único ponto de wiring):
   * - repositories (Prisma)
   * - gateways (Omie)
   * - use cases
   * - app.decorate(...)
   */

  app.register(productSectorsRoutes, { prefix: '/product-sectors' })
}

// export opcional (útil para testes/consumo interno)
export const ProductSectors = { module: productSectorsModule }
