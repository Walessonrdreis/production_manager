import { apiClient } from '../api/client'

/** Envelope padrão da API */
export type ApiEnvelope<T> = {
  data: T
  meta?: Record<string, any>
}

/** Modelos que vamos usar no front (resumidos) */
export type OrderItem = {
  omieItemCode: string
  description: string
  quantity: string // Decimal vem como string
  unit?: string | null
  rawPayload?: any
}

export type Order = {
  omieCode: string
  numeroPedido?: string | null
  etapa: string
  cancelado: string
  encerrado: string
  dataPrevisao?: string | null
  lastSyncAt?: string | null
  rawPayload?: any
  items: OrderItem[]
}

export type OrdersListResponse = {
  page: number
  pageSize: number
  total: number
  includeRaw?: boolean
  orders: Order[]
}

export type Stage20Total = {
  description: string
  totalQuantity: number
}

export type SyncResult = {
  ok: boolean
  reason: 'DONE' | 'LOCKED'
  syncedOrders?: number
  skippedOrders?: number
  pages?: number
  lockedUntil?: string
  omieEndpoint?: { path: string; call: string }
}

export type Stage20OrderItem = {
  description: string
  quantity: string
}

export type Stage20Order = {
  id: string
  omieCode: string
  numeroPedido: string | null
  etapa: string
  cancelado: string
  encerrado: string
  dataPrevisao: string | null
  lastSyncAt: string | null
  items: Stage20OrderItem[]
}

export type PaginatedResponse<T> = {
  data: T[]
  meta: {
    page: number
    pageSize: number
    total: number
  }
}

/** Endpoints */
export async function fetchOrders(params: {
  page?: number
  pageSize?: number
  includeRaw?: boolean
} = {}) {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 50
  const includeRaw = params.includeRaw ?? false

  const qs = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    includeRaw: String(includeRaw),
  })

  return apiClient.get<ApiEnvelope<OrdersListResponse>>(
    `/v1/admin/orders?${qs.toString()}`
  )
}

export async function fetchStage20Totals() {
  return apiClient.get<ApiEnvelope<Stage20Total[]>>(
    `/v1/admin/orders/stage20/totals`
  )
}

export async function fetchStage20Orders(params: {
  page?: number
  pageSize?: number
  q?: string
} = {}) {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 50

  const qs = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  })

  if (params.q?.trim()) {
    qs.set('q', params.q.trim())
  }

  return apiClient.get<PaginatedResponse<Stage20Order>>(
    `/v1/admin/orders/stage20?${qs.toString()}`
  )
}

export async function runStage20Sync() {
  return apiClient.post<ApiEnvelope<SyncResult>>(
    `/v1/admin/omie/orders/stage20/sync`
  )
}
