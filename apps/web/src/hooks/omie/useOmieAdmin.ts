import { useState } from 'react'
import {
  fetchOmieCategories,
  fetchOmieProductByCode,
  fetchOmieProductById,
  fetchOmieProductStockByCode,
  fetchOmieProductStockById,
  fetchOmieStockInfo,
  pingStage20Sync,
  refreshOmieStock,
  searchOmieProducts,
  syncOmieProducts,
  type OmieProductDetails,
  type OmieProductStock,
  type OmieSearchItem,
  type OmieStockInfo,
} from '../../lib/omieAdminApi'

function safeJson(value: unknown) {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

export function useOmieAdmin() {
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [resultMessage, setResultMessage] = useState<string | null>(null)

  const [stockInfo, setStockInfo] = useState<OmieStockInfo | null>(null)

  const [categoriesQuery, setCategoriesQuery] = useState('')
  const [categories, setCategories] = useState<string[]>([])

  const [searchQuery, setSearchQuery] = useState('')
  const [searchPage, setSearchPage] = useState(1)
  const [searchRows, setSearchRows] = useState<OmieSearchItem[]>([])
  const [searchTotal, setSearchTotal] = useState(0)

  const [includeRaw, setIncludeRaw] = useState(false)
  const [lookupId, setLookupId] = useState('')
  const [lookupCode, setLookupCode] = useState('')
  const [productDetails, setProductDetails] = useState<OmieProductDetails | null>(null)
  const [productStock, setProductStock] = useState<OmieProductStock | null>(null)

  async function runAction<T>(key: string, fn: () => Promise<T>) {
    setBusyAction(key)
    setError(null)
    setResultMessage(null)
    try {
      return await fn()
    } catch (e: any) {
      setError(e?.message ?? 'Erro ao executar ação')
      return null
    } finally {
      setBusyAction(null)
    }
  }

  async function syncProducts() {
    const r = await runAction('sync-products', () => syncOmieProducts())
    if (!r) return
    const count = r.data?.upserted ?? r.data?.inserted ?? 0
    setResultMessage(`Sync concluído. Registros processados: ${count}.`)
  }

  async function refreshStock() {
    const r = await runAction('refresh-stock', () => refreshOmieStock(false))
    if (!r) return
    setResultMessage(`Refresh concluído. Inseridos: ${r.data.insertedCount}.`)
  }

  async function pingStage20() {
    const r = await runAction('ping-stage20', () => pingStage20Sync())
    if (!r) return
    setResultMessage(`Ping Stage 20: ${r.data.ok ? 'ok' : 'falhou'}.`)
  }

  async function loadStockInfo() {
    const r = await runAction('stock-info', () => fetchOmieStockInfo())
    if (!r) return
    setStockInfo(r.data)
  }

  async function loadCategories() {
    const r = await runAction('categories', () => fetchOmieCategories(categoriesQuery))
    if (!r) return
    setCategories(r.data ?? [])
  }

  async function searchProducts(page = searchPage) {
    if (!searchQuery.trim()) {
      setError('Informe um termo de busca.')
      return
    }
    const r = await runAction('search-products', () =>
      searchOmieProducts({ q: searchQuery.trim(), page, pageSize: 20 }),
    )
    if (!r) return
    setSearchRows(r.data ?? [])
    setSearchTotal(r.meta?.total ?? 0)
    setSearchPage(r.meta?.page ?? page)
  }

  async function lookupById() {
    if (!lookupId.trim()) {
      setError('Informe um ID.')
      return
    }
    const [d, s] = await Promise.all([
      runAction('lookup-id-details', () => fetchOmieProductById(lookupId.trim(), includeRaw)),
      runAction('lookup-id-stock', () => fetchOmieProductStockById(lookupId.trim())),
    ])
    if (d) setProductDetails(d.data)
    if (s) setProductStock(s.data)
  }

  async function lookupByCode() {
    if (!lookupCode.trim()) {
      setError('Informe um código Omie.')
      return
    }
    const [d, s] = await Promise.all([
      runAction('lookup-code-details', () => fetchOmieProductByCode(lookupCode.trim(), includeRaw)),
      runAction('lookup-code-stock', () => fetchOmieProductStockByCode(lookupCode.trim())),
    ])
    if (d) setProductDetails(d.data)
    if (s) setProductStock(s.data)
  }

  return {
    busyAction,
    error,
    resultMessage,

    stockInfo,

    categoriesQuery,
    setCategoriesQuery,
    categories,
    loadCategories,

    searchQuery,
    setSearchQuery,
    searchPage,
    searchTotal,
    searchRows,
    searchProducts,

    includeRaw,
    setIncludeRaw,
    lookupId,
    setLookupId,
    lookupCode,
    setLookupCode,
    productDetails,
    productStock,

    syncProducts,
    refreshStock,
    pingStage20,
    loadStockInfo,
    lookupById,
    lookupByCode,

    safeJson,
  }
}