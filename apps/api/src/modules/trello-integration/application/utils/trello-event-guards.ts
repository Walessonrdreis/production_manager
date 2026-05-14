import type { TrelloWebhookEvent } from '../dtos/trello-webhook-event.dto'

export function isCardEnteredTargetList(event: TrelloWebhookEvent, targetListId: string): boolean {
  const { action } = event

  if (action.type === 'createCard' || action.type === 'copyCard') {
    return action.data.list?.id === targetListId
  }

  if (action.type === 'updateCard') {
    const listBefore = action.data.listBefore?.id
    const listAfter = action.data.listAfter?.id
    return listBefore !== targetListId && listAfter === targetListId
  }

  return false
}
