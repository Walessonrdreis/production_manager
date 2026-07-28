import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchOrders, runStage20Sync, type Order } from '../../lib/ordersApi'

type ExpandedMap = Record<string, boolean>

export function useOrders() {
  // Paginação
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)

  // Flags / filtros UI
  const [includeRaw, setIncludeRaw] = useState(false)
  const [q, setQ] = useState('') // filtro local (não bate no backend)
  const [expanded, setExpanded] = useState<ExpandedMap>({}) // rawPayload por pedido

  // Estado de dados
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [total, setTotal] = useState(0)
  const [orders, setOrders] = useState<Order[]>([])

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(total / pageSize))
  }, [total, pageSize])

  const queryNormalized = useMemo(() => q.trim().toLowerCase(), [q])

  // Filtro local (não muda total/paginação do backend)
  const visibleOrders = useMemo(() => {
    if (!queryNormalized) return orders

    return orders.filter((o) => {
      const numero = (o.numeroPedido ?? '').toLowerCase()
      const code = (o.omieCode ?? '').toLowerCase()

      if (numero.includes(queryNormalized)) return true
      if (code.includes(queryNormalized)) return true

      // busca nos itens
      return (o.items ?? []).some((it) =>
        (it.description ?? '').toLowerCase().includes(queryNormalized)
      )
    })
  }, [orders, queryNormalized])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetchOrders({ page, pageSize, includeRaw })
      setOrders(res.data.orders)
      setTotal(res.data.total)
    } catch (e: any) {
      setError(e?.message ?? 'Erro ao carregar ordens')
      setOrders([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, includeRaw])

  const handleSyncStage20 = useCallback(async () => {
    setSyncing(true)
    setError(null)

    try {
      const res = await runStage20Sync()
      // mantém o comportamento atual: log no console
      console.log('[SYNC RESULT]', res.data)
      // recarrega a lista depois do sync
      await load()
    } catch (e: any) {
      setError(e?.message ?? 'Erro ao sincronizar etapa 20')
    } finally {
      setSyncing(false)
    }
  }, [load])

  // Mantém exatamente o comportamento: carrega sempre que mudar page/pageSize/includeRaw
  useEffect(() => {
    void load()
  }, [page, pageSize, includeRaw])

  // Mantém exatamente o comportamento: ao mudar pageSize, volta page=1 (pode gerar 2 loads como hoje)
  useEffect(() => {
    setPage(1)
  }, [pageSize])

  const toggleExpanded = useCallback((omieCode: string) => {
    setExpanded((prev) => ({ ...prev, [omieCode]: !prev[omieCode] }))
  }, [])

  const goFirst = useCallback(() => setPage(1), [])
  const goPrev = useCallback(() => setPage((p) => Math.max(1, p - 1)), [])
  const goNext = useCallback(() => setPage((p) => Math.min(totalPages, p + 1)), [totalPages])
  const goLast = useCallback(() => setPage(totalPages), [totalPages])

  return {
    // state
    page,
    pageSize,
    includeRaw,
    q,
    expanded,
    loading,
    syncing,
    error,
    total,
    orders,
    totalPages,
    visibleOrders,

    // actions
    setPage,
    setPageSize,
    setIncludeRaw,
    setQ,
    load,
    handleSyncStage20,
    toggleExpanded,
    goFirst,
    goPrev,
    goNext,
    goLast,
  }
}
