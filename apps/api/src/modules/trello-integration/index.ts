import { FastifyInstance } from 'fastify'
import { registerTrelloIntegrationModule } from './register'

export async function trelloIntegrationModule(app: FastifyInstance) {
  await registerTrelloIntegrationModule(app)
}

export { registerTrelloIntegrationModule } from './register'
export { ProcessTrelloWebhookUseCase } from './application/use-cases/process-trello-webhook.use-case'
export { TrelloWebhookController } from './presentation/http/controllers/trello-webhook.controller'
export { registerTrelloIntegrationRoutes } from './presentation/http/routes'
export { parseCardName } from './application/utils/parse-card-name'
export { isCardEnteredTargetList } from './application/utils/trello-event-guards'

export type { TrelloWebhookEvent, ParsedCardName, ProcessWebhookResult } from './application/dtos/trello-webhook-event.dto'
