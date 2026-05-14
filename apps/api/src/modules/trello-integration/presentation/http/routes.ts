import { FastifyInstance } from 'fastify'
import { TrelloWebhookController } from './controllers/trello-webhook.controller'

export function registerTrelloIntegrationRoutes(app: FastifyInstance, controller: TrelloWebhookController) {
  app.get('/trello/webhook', controller.handleGet.bind(controller))
  app.post('/trello/webhook', controller.handlePost.bind(controller))
}
