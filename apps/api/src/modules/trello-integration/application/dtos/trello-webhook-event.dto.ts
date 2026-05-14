export interface TrelloWebhookEvent {
  action: {
    id: string
    type: 'createCard' | 'copyCard' | 'updateCard'
    data: {
      list?: { id: string; name?: string }
      listBefore?: { id: string; name?: string }
      listAfter?: { id: string; name?: string }
      card: {
        id: string
        name: string
        url?: string
        idList?: string
      }
      board?: { id: string; name?: string }
    }
    memberCreator?: {
      id: string
      fullName?: string
      username?: string
    }
  }
}

export interface ParsedCardName {
  lote: string
  quantityValue: number
  quantityUnit: 'UN' | 'B' | 'G' | 'KG'
  omieCode?: string | null
  parsedProductName?: string | null
}

export interface ProcessWebhookResult {
  handled: boolean
  created: boolean
  reason?: string
  productionOrderId?: string
}
