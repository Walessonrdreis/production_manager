// AUTO-GENERATED: module-scaffold
import { FastifyInstance } from 'fastify'
import { ordersEnrichedRoutes } from './presentation/http/routes'

export async function ordersEnrichedModule(app: FastifyInstance) {
  /**
   * Composição do módulo orders-enriched (único ponto de wiring):
   * - repositories (Prisma)
   * - gateways (Omie)
   * - use cases
   * - app.decorate(...)
   */

  app.register(ordersEnrichedRoutes, { prefix: '/orders-enriched' })
}

// export opcional (útil para testes/consumo interno)
export const OrdersEnriched = { module: ordersEnrichedModule }
