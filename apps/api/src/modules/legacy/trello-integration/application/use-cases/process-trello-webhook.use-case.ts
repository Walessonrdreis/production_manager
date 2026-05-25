import type { TrelloWebhookEvent, ProcessWebhookResult } from '../dtos/trello-webhook-event.dto'
import { parseCardName } from '../utils/parse-card-name'
import { isCardEnteredTargetList } from '../utils/trello-event-guards'
import type { CreateInternalProductionOrderUseCase } from '../../../internal-production-orders/application/use-cases/create-internal-production-order.usecase'
import type { CreateInternalProductionOrderInput } from '../../../internal-production-orders/application/dtos/internal-production-order.dto'

export interface ProcessTrelloWebhookDependencies {
  createInternalProductionOrderUseCase: CreateInternalProductionOrderUseCase
  targetListId: string
  logger?: { info: (msg: string, data?: unknown) => void; error: (msg: string, data?: unknown) => void }
}

export class ProcessTrelloWebhookUseCase {
  constructor(private readonly deps: ProcessTrelloWebhookDependencies) {}

  async execute(event: TrelloWebhookEvent): Promise<ProcessWebhookResult> {
    const { createInternalProductionOrderUseCase, targetListId, logger } = this.deps

    logger?.info('Webhook recebido', { type: event.action.type, cardId: event.action.data.card.id })

    if (!isCardEnteredTargetList(event, targetListId)) {
      logger?.info('Evento ignorado - não entrou na lista alvo', {
        type: event.action.type,
        cardId: event.action.data.card.id,
      })
      return { handled: false, created: false, reason: 'not-target-list' }
    }

    const cardName = event.action.data.card.name
    const parsed = parseCardName(cardName)
    if (!parsed) {
      logger?.info('Evento ignorado - falha no parsing do nome', {
        cardId: event.action.data.card.id,
        cardName,
      })
      return { handled: true, created: false, reason: 'parse-failed' }
    }

    const input: CreateInternalProductionOrderInput = {
      lote: parsed.lote,
      quantityValue: parsed.quantityValue,
      quantityUnit: parsed.quantityUnit,
      omieCode: parsed.omieCode ?? null,
      parsedProductName: parsed.parsedProductName ?? null,
      source: 'TRELLO',
      trelloCardId: event.action.data.card.id,
      trelloCardUrl: event.action.data.card.url ?? null,
    }

    try {
      const result = await createInternalProductionOrderUseCase.execute(input, 'INTEGRATION', null)
      logger?.info('OP interna criada via Trello', {
        productionOrderId: result.id,
        lote: result.lote,
      })
      return { handled: true, created: true, productionOrderId: result.id }
    } catch (error) {
      if (error instanceof Error && error.message.includes('já existe')) {
        logger?.info('OP interna já existe para este card', { cardId: event.action.data.card.id })
        return { handled: true, created: false, reason: 'already-exists' }
      }
      logger?.error('Erro ao criar OP interna via Trello', {
        cardId: event.action.data.card.id,
        error: error instanceof Error ? error.message : 'unknown',
      })
      return { handled: true, created: false, reason: 'internal-error' }
    }
  }
}
