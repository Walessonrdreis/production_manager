import { apiClient } from '../api/client'

export type ApiEnvelope<T> = {
  data: T
  meta?: Record<string, any>
}

export type OmieStockInfo = {
  lastRefreshAt: string | null
  totalItems: number
  source: string
}

export type OmieSearchItem = {
  id: string
  description: string
  sku: string | null
  familyDescription: string | null
  active: boolean
  omieCode?: string
}

export type OmieProductDetails = {
  id: string
  description: string
  sku: string | null
  familyDescription: string | null
  active: boolean
  omieCode: string | null
  rawPayload?: unknown
}

export type OmieProductStock = {
  omieProductId?: string
  omieCode: string
  quantity: string
  reported: boolean
  rawQuantity: string | null
  minimum: string
  rawMinimum: string | null
  stockQuantity: string
  minimumStock: string
  capturedAt: string
  stockCacheUpdatedAt?: string
}

type PaginatedResponse<T> = {
  data: T[]
  meta: {
    page: number
    pageSize: number
    total: number
  }
}

export async function syncOmieProducts() {
  return apiClient.post<ApiEnvelope<{ upserted?: number; inserted?: number }>>(
    '/v1/admin/omie/sync/products'
  )
}

export async function refreshOmieStock(dryRun = false) {
  const qs = new URLSearchParams({ dryRun: String(dryRun) })
  return apiClient.post<ApiEnvelope<{ insertedCount: number }>>(
    `/v1/admin/omie/products/stock/refresh?${qs.toString()}`
  )
}

export async function fetchOmieStockInfo() {
  return apiClient.get<ApiEnvelope<OmieStockInfo>>('/v1/admin/omie/stock')
}

export async function fetchOmieCategories(q = '') {
  const qs = new URLSearchParams()
  if (q.trim()) qs.set('q', q.trim())
  return apiClient.get<ApiEnvelope<string[]>>(
    `/v1/admin/omie/categories${qs.toString() ? `?${qs.toString()}` : ''}`
  )
}

export async function searchOmieProducts(params: {
  q: string
  page?: number
  pageSize?: number
}) {
  const qs = new URLSearchParams({
    q: params.q,
    page: String(params.page ?? 1),
    pageSize: String(params.pageSize ?? 20),
  })
  return apiClient.get<PaginatedResponse<OmieSearchItem>>(
    `/v1/admin/omie/products/search?${qs.toString()}`
  )
}

export async function fetchOmieProductById(id: string, includeRaw = false) {
  const qs = new URLSearchParams({ includeRaw: String(includeRaw) })
  return apiClient.get<ApiEnvelope<OmieProductDetails>>(
    `/v1/admin/omie/products/${id}?${qs.toString()}`
  )
}

export async function fetchOmieProductByCode(omieCode: string, includeRaw = false) {
  const qs = new URLSearchParams({ includeRaw: String(includeRaw) })
  return apiClient.get<ApiEnvelope<OmieProductDetails>>(
    `/v1/admin/omie/products/by-code/${encodeURIComponent(omieCode)}?${qs.toString()}`
  )
}

export async function fetchOmieProductStockById(id: string) {
  return apiClient.get<ApiEnvelope<OmieProductStock>>(
    `/v1/admin/omie/products/${id}/stock`
  )
}

export async function fetchOmieProductStockByCode(omieCode: string) {
  return apiClient.get<ApiEnvelope<OmieProductStock>>(
    `/v1/admin/omie/products/by-code/${encodeURIComponent(omieCode)}/stock`
  )
}

export async function pingStage20Sync() {
  return apiClient.get<ApiEnvelope<{ ok: boolean }>>(
    '/v1/admin/omie/orders/stage20/ping'
  )
}
