import { FastifyInstance } from 'fastify'
import { clientRoutes } from './presentation/http/routes'

export async function clientModule(app: FastifyInstance) {
  // composição de dependências do módulo client

  app.register(clientRoutes, { prefix: '/client' })
}
