import type { FastifyInstance } from 'fastify'
import { ProcessTrelloWebhookUseCase } from './application/use-cases/process-trello-webhook.use-case'
import { TrelloWebhookController } from './presentation/http/controllers/trello-webhook.controller'
import { registerTrelloIntegrationRoutes } from './presentation/http/routes'

const DEFAULT_TARGET_LIST_ID = ''

export async function registerTrelloIntegrationModule(app: FastifyInstance) {
  const targetListId = process.env['TRELLO_LISTA_PRODUCAO_ID'] || DEFAULT_TARGET_LIST_ID
  const createInternalProductionOrderUseCase = app.createInternalProductionOrderUseCase

  if (!createInternalProductionOrderUseCase) {
    app.log.error('createInternalProductionOrderUseCase não encontrado - trello-integration não será registrado')
    return
  }

  const processWebhook = new ProcessTrelloWebhookUseCase({
    createInternalProductionOrderUseCase,
    targetListId,
    logger: app.log,
  })

  const controller = new TrelloWebhookController(processWebhook)

  registerTrelloIntegrationRoutes(app, controller)
}
