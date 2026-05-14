// AUTO-GENERATED: module-scaffold
import { FastifyInstance } from 'fastify'
import { trelloIntegrationRoutes } from './presentation/http/routes'

export async function trelloIntegrationModule(app: FastifyInstance) {
  /**
   * Composição do módulo trello-integration (único ponto de wiring):
   * - repositories (Prisma)
   * - gateways (Omie)
   * - use cases
   * - app.decorate(...)
   */

  app.register(trelloIntegrationRoutes, { prefix: '/trello-integration' })
}

// export opcional (útil para testes/consumo interno)
export const TrelloIntegration = { module: trelloIntegrationModule }
