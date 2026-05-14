import { describe, it, expect, vi } from 'vitest'
import { ProcessTrelloWebhookUseCase } from './process-trello-webhook.use-case'
import type { TrelloWebhookEvent } from '../dtos/trello-webhook-event.dto'
import type { CreateInternalProductionOrderUseCase } from '../../../internal-production-orders/application/use-cases/create-internal-production-order.usecase'
import type { InternalProductionOrderOutput } from '../../../internal-production-orders/application/dtos/internal-production-order.dto'

const TARGET_LIST_ID = 'lista-producao'
const OTHER_LIST_ID = 'lista-outra'

function makeCreateCardEvent(listId: string, cardName = 'Produto - LOTE001 - 10 un'): TrelloWebhookEvent {
  return {
    action: {
      id: 'action-1',
      type: 'createCard',
      data: {
        list: { id: listId, name: 'Lista Alvo' },
        card: { id: 'card-1', name: cardName, url: 'https://trello.com/c/card-1' },
      },
    },
  }
}

function makeCopyCardEvent(listId: string, cardName = 'Produto - LOTE001 - 10 un'): TrelloWebhookEvent {
  return {
    action: {
      id: 'action-2',
      type: 'copyCard',
      data: {
        list: { id: listId, name: 'Lista Alvo' },
        card: { id: 'card-2', name: cardName, url: 'https://trello.com/c/card-2' },
      },
    },
  }
}

function makeUpdateCardMoveEvent(listBeforeId: string, listAfterId: string, cardName = 'Produto - LOTE001 - 10 un'): TrelloWebhookEvent {
  return {
    action: {
      id: 'action-3',
      type: 'updateCard',
      data: {
        listBefore: { id: listBeforeId, name: 'Antes' },
        listAfter: { id: listAfterId, name: 'Depois' },
        card: { id: 'card-3', name: cardName, url: 'https://trello.com/c/card-3' },
      },
    },
  }
}

function makeUpdateCardEditEvent(currentListId: string, cardName = 'Produto - LOTE001 - 10 un'): TrelloWebhookEvent {
  return {
    action: {
      id: 'action-4',
      type: 'updateCard',
      data: {
        listBefore: { id: currentListId, name: 'Mesma' },
        listAfter: { id: currentListId, name: 'Mesma' },
        card: { id: 'card-4', name: cardName, url: 'https://trello.com/c/card-4' },
      },
    },
  }
}

const fakeOrderOutput: InternalProductionOrderOutput = {
  id: 'op-123',
  lote: 'LOTE001',
  quantityValue: 10,
  quantityUnit: 'UN',
  source: 'TRELLO',
  trelloCardId: 'card-1',
  trelloCardUrl: 'https://trello.com/c/card-1',
  omieCode: null,
  parsedProductName: 'Produto',
  productDescription: null,
  stockQuantity: null,
  minimumStock: null,
  startedAt: null,
  completedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const logger = { info: vi.fn(), error: vi.fn() }

describe('ProcessTrelloWebhookUseCase', () => {
  function setupUseCase(mockExecute = vi.fn().mockResolvedValue(fakeOrderOutput)): ProcessTrelloWebhookUseCase {
    const mockUseCase = { execute: mockExecute } as unknown as CreateInternalProductionOrderUseCase
    return new ProcessTrelloWebhookUseCase({
      createInternalProductionOrderUseCase: mockUseCase,
      targetListId: TARGET_LIST_ID,
      logger,
    })
  }

  describe('createCard na lista alvo', () => {
    it('deve chamar CreateInternalProductionOrderUseCase e retornar created=true', async () => {
      const execute = vi.fn().mockResolvedValue(fakeOrderOutput)
      const useCase = setupUseCase(execute)
      const event = makeCreateCardEvent(TARGET_LIST_ID)

      const result = await useCase.execute(event)

      expect(result.handled).toBe(true)
      expect(result.created).toBe(true)
      expect(result.productionOrderId).toBe('op-123')
      expect(execute).toHaveBeenCalledTimes(1)
      expect(execute).toHaveBeenCalledWith(
        expect.objectContaining({
          lote: 'LOTE001',
          quantityValue: 10,
          quantityUnit: 'UN',
          source: 'TRELLO',
          trelloCardId: 'card-1',
        }),
        'INTEGRATION',
        null,
      )
    })
  })

  describe('copyCard na lista alvo', () => {
    it('deve chamar CreateInternalProductionOrderUseCase e retornar created=true', async () => {
      const execute = vi.fn().mockResolvedValue(fakeOrderOutput)
      const useCase = setupUseCase(execute)
      const event = makeCopyCardEvent(TARGET_LIST_ID)

      const result = await useCase.execute(event)

      expect(result.handled).toBe(true)
      expect(result.created).toBe(true)
      expect(result.productionOrderId).toBe('op-123')
      expect(execute).toHaveBeenCalledTimes(1)
    })
  })

  describe('updateCard movendo para lista alvo', () => {
    it('deve chamar CreateInternalProductionOrderUseCase', async () => {
      const execute = vi.fn().mockResolvedValue(fakeOrderOutput)
      const useCase = setupUseCase(execute)
      const event = makeUpdateCardMoveEvent(OTHER_LIST_ID, TARGET_LIST_ID)

      const result = await useCase.execute(event)

      expect(result.handled).toBe(true)
      expect(result.created).toBe(true)
      expect(execute).toHaveBeenCalledTimes(1)
    })

    it('deve rejeitar se listBefore for a lista alvo (card já estava na lista)', async () => {
      const execute = vi.fn()
      const useCase = setupUseCase(execute)
      const event = makeUpdateCardMoveEvent(TARGET_LIST_ID, TARGET_LIST_ID)

      const result = await useCase.execute(event)

      expect(result.handled).toBe(false)
      expect(result.created).toBe(false)
      expect(result.reason).toBe('not-target-list')
      expect(execute).not.toHaveBeenCalled()
    })
  })

  describe('updateCard editando (sem mudança de lista)', () => {
    it('não deve chamar CreateInternalProductionOrderUseCase', async () => {
      const execute = vi.fn()
      const useCase = setupUseCase(execute)
      const event = makeUpdateCardEditEvent(OTHER_LIST_ID)

      const result = await useCase.execute(event)

      expect(result.handled).toBe(false)
      expect(result.created).toBe(false)
      expect(result.reason).toBe('not-target-list')
      expect(execute).not.toHaveBeenCalled()
    })
  })

  describe('evento em outra lista', () => {
    it('createCard em outra lista não deve chamar use-case', async () => {
      const execute = vi.fn()
      const useCase = setupUseCase(execute)
      const event = makeCreateCardEvent(OTHER_LIST_ID)

      const result = await useCase.execute(event)

      expect(result.handled).toBe(false)
      expect(result.created).toBe(false)
      expect(result.reason).toBe('not-target-list')
      expect(execute).not.toHaveBeenCalled()
    })
  })

  describe('parsing do nome falha', () => {
    it('deve retornar parse-failed quando nome do card não é parseável', async () => {
      const execute = vi.fn()
      const useCase = setupUseCase(execute)
      const event = makeCreateCardEvent(TARGET_LIST_ID, 'Nome inválido')

      const result = await useCase.execute(event)

      expect(result.handled).toBe(true)
      expect(result.created).toBe(false)
      expect(result.reason).toBe('parse-failed')
      expect(execute).not.toHaveBeenCalled()
    })
  })

  describe('idempotência (trelloCardId duplicado)', () => {
    it('deve retornar already-exists quando use-case lançar erro de duplicata', async () => {
      const execute = vi.fn().mockRejectedValue(new Error('OP interna com trelloCardId card-1 já existe'))
      const useCase = setupUseCase(execute)
      const event = makeCreateCardEvent(TARGET_LIST_ID)

      const result = await useCase.execute(event)

      expect(result.handled).toBe(true)
      expect(result.created).toBe(false)
      expect(result.reason).toBe('already-exists')
    })
  })

  describe('erro interno no use-case', () => {
    it('deve retornar internal-error em caso de exceção desconhecida', async () => {
      const execute = vi.fn().mockRejectedValue(new Error('Erro de banco'))
      const useCase = setupUseCase(execute)
      const event = makeCreateCardEvent(TARGET_LIST_ID)

      const result = await useCase.execute(event)

      expect(result.handled).toBe(true)
      expect(result.created).toBe(false)
      expect(result.reason).toBe('internal-error')
    })
  })
})
