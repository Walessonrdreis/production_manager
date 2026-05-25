export type InternalProductionOrderSource = 'MANUAL' | 'TRELLO'
export type InternalProductionOrderStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
export type InternalProductionOrderQuantityUnit = 'UN' | 'B' | 'G' | 'KG'
export type InternalProductionOrderActorType = 'SYSTEM' | 'INTEGRATION' | 'USER'
export type InternalProductionOrderEventSource = 'TRELLO' | 'MANUAL' | 'SYSTEM'

export interface InternalProductionOrder {
  id: string
  trelloCardId: string | null
  trelloCardUrl: string | null
  source: InternalProductionOrderSource
  status: InternalProductionOrderStatus
  lote: string
  quantityValue: number
  quantityUnit: InternalProductionOrderQuantityUnit
  omieCode: string | null
  parsedProductName: string | null
  productDescription: string | null
  stockQuantity: number | null
  minimumStock: number | null
  startedAt: Date | null
  completedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface InternalProductionOrderEvent {
  id: string
  orderId: string
  type: string
  actorType: InternalProductionOrderActorType
  actorId: string | null
  source: InternalProductionOrderEventSource
  message: string
  createdAt: Date
}

export interface InternalProductionOrderChange {
  id: string
  eventId: string
  field: string
  before: string | null
  after: string | null
}
