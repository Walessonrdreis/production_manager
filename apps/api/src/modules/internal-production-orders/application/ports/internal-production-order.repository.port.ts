import type { InternalProductionOrder } from '../entities/internal-production-order.entity'
import type { CreateInternalProductionOrderInput, UpdateInternalProductionOrderInput, ListInternalProductionOrdersInput } from '../dtos/internal-production-order.dto'
import type { InternalProductionOrderActorType, InternalProductionOrderEventSource } from '../entities/internal-production-order.entity'

export interface CreateEventInput {
  orderId: string
  type: string
  actorType: InternalProductionOrderActorType
  actorId: string | null
  source: InternalProductionOrderEventSource
  message: string
}

export interface CreateChangeInput {
  field: string
  before: string | null
  after: string | null
}

export interface InternalProductionOrderRepositoryPort {
  create(data: CreateInternalProductionOrderInput & { trelloCardId?: string | null }): Promise<InternalProductionOrder>
  update(id: string, data: UpdateInternalProductionOrderInput): Promise<InternalProductionOrder>
  start(id: string): Promise<InternalProductionOrder>
  complete(id: string): Promise<InternalProductionOrder>
  findById(id: string): Promise<InternalProductionOrder | null>
  findByTrelloCardId(trelloCardId: string): Promise<InternalProductionOrder | null>
  list(params: ListInternalProductionOrdersInput): Promise<{ items: InternalProductionOrder[]; total: number }>

  createEventWithChanges(event: CreateEventInput, changes: CreateChangeInput[]): Promise<void>
}
