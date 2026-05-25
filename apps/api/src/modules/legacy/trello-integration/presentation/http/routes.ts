import { FastifyInstance } from 'fastify'
import { TrelloWebhookController } from './controllers/trello-webhook.controller'

export function registerTrelloIntegrationRoutes(app: FastifyInstance, controller: TrelloWebhookController) {
  app.get('/v1/trello/webhook', controller.handleGet.bind(controller))
  app.post('/v1/trello/webhook', controller.handlePost.bind(controller))
}
