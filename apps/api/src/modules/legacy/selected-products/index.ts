// AUTO-GENERATED: module-scaffold
import { FastifyInstance } from 'fastify'
import { selectedProductsRoutes } from './presentation/http/routes'

export async function selectedProductsModule(app: FastifyInstance) {
  /**
   * Composição do módulo selected-products (único ponto de wiring):
   * - repositories (Prisma)
   * - gateways (Omie)
   * - use cases
   * - app.decorate(...)
   */

  app.register(selectedProductsRoutes, { prefix: '/selected-products' })
}

// export opcional (útil para testes/consumo interno)
export const SelectedProducts = { module: selectedProductsModule }
