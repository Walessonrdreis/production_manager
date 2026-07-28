import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchOrders, runStage20Sync, type Order } from '../lib/ordersApi'

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function safeJson(value: any) {
  try {
    return JSON.stringify(value ?? null, null, 2)
  } catch {
    return String(value)
  }
}

export function OrdersPage() {
  // Paginação
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)

  // Flags / filtros UI
  const [includeRaw, setIncludeRaw] = useState(false)
  const [q, setQ] = useState('') // filtro local (não bate no backend)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({}) // rawPayload por pedido

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

  async function load() {
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
  }

  async function handleSyncStage20() {
    setSyncing(true)
    setError(null)

    try {
      const res = await runStage20Sync()
      // opcional: mostrar no console o resultado do sync
      console.log('[SYNC RESULT]', res.data)
      // recarrega a lista depois do sync
      await load()
    } catch (e: any) {
      setError(e?.message ?? 'Erro ao sincronizar etapa 20')
    } finally {
      setSyncing(false)
    }
  }

  useEffect(() => {
    void load()
  }, [page, pageSize, includeRaw])

  // Se pageSize mudar, volta para página 1 (evita página inválida)
  useEffect(() => {
    setPage(1)
  }, [pageSize])

  function toggleExpanded(omieCode: string) {
    setExpanded((prev) => ({ ...prev, [omieCode]: !prev[omieCode] }))
  }

  function goFirst() {
    setPage(1)
  }
  function goPrev() {
    setPage((p) => Math.max(1, p - 1))
  }
  function goNext() {
    setPage((p) => Math.min(totalPages, p + 1))
  }
  function goLast() {
    setPage(totalPages)
  }

  return (
    <div style={{ padding: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0 }}>Ordens</h1>

        <button onClick={handleSyncStage20} disabled={syncing || loading}>
          {syncing ? 'Sincronizando...' : 'Sincronizar etapa 20'}
        </button>

        <button onClick={load} disabled={loading || syncing}>
          {loading ? 'Carregando...' : 'Recarregar'}
        </button>

        <Link to="/orders/stage20/totals" style={{ marginLeft: 8 }}>
          Ver Totais (Etapa 20)
        </Link>
        <Link to="/orders/stage20" style={{ marginLeft: 8 }}>
          Ver Pedidos da Etapa 20
        </Link>
        <Link to="/omie/admin" style={{ marginLeft: 8 }}>
          OMIE Admin
        </Link>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={includeRaw}
            onChange={(e) => setIncludeRaw(e.target.checked)}
          />
          includeRaw
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          pageSize
          <select
            value={pageSize}
            onChange={(e) => setPageSize(clamp(Number(e.target.value), 1, 200))}
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
          </select>
        </label>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar (nº pedido, código, descrição item)..."
          style={{ padding: 6, minWidth: 320 }}
        />
      </div>

      {/* Summary */}
      <p style={{ marginTop: 8, color: '#666' }}>
        Total no banco: <b>{total}</b> — Página <b>{page}</b> de <b>{totalPages}</b>
        {q.trim() ? (
          <>
            {' '}
            — Filtro local: <b>{visibleOrders.length}</b> resultados nesta página
          </>
        ) : null}
      </p>

      {/* Error */}
      {error && (
        <div
          style={{
            padding: 12,
            background: '#ffecec',
            color: '#900',
            borderRadius: 6,
            marginTop: 12,
          }}
        >
          <b>Erro:</b> {error}
        </div>
      )}

      {/* Empty */}
      {!loading && orders.length === 0 && !error && (
        <p style={{ marginTop: 16 }}>Nenhuma ordem encontrada.</p>
      )}

      {/* Orders list */}
      {!loading && visibleOrders.length > 0 && (
        <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
          {visibleOrders.map((o) => {
            const title = o.numeroPedido ? `Pedido #${o.numeroPedido}` : `Pedido ${o.omieCode}`
            const isExpanded = !!expanded[o.omieCode]

            return (
              <div
                key={o.omieCode}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: 8,
                  padding: 12,
                  background: '#fff',
                }}
              >
                {/* Order header */}
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                  <div style={{ fontWeight: 700 }}>{title}</div>

                  <span style={{ color: '#444' }}>
                    <b>Etapa:</b> {o.etapa}
                  </span>

                  <span style={{ color: '#444' }}>
                    <b>Cancelado:</b> {o.cancelado}
                  </span>

                  <span style={{ color: '#444' }}>
                    <b>Encerrado:</b> {o.encerrado}
                  </span>

                  {o.dataPrevisao && (
                    <span style={{ color: '#444' }}>
                      <b>Prev:</b> {new Date(o.dataPrevisao).toLocaleDateString()}
                    </span>
                  )}

                  {o.lastSyncAt && (
                    <span style={{ color: '#444' }}>
                      <b>Sync:</b> {new Date(o.lastSyncAt).toLocaleString()}
                    </span>
                  )}

                  <span style={{ color: '#444' }}>
                    <b>Itens:</b> {o.items?.length ?? 0}
                  </span>

                  {includeRaw && (
                    <button
                      onClick={() => toggleExpanded(o.omieCode)}
                      style={{ marginLeft: 'auto' }}
                    >
                      {isExpanded ? 'Ocultar rawPayload' : 'Ver rawPayload'}
                    </button>
                  )}
                </div>

                {/* Items */}
                <div style={{ marginTop: 10 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>
                          Descrição
                        </th>
                        <th style={{ textAlign: 'right', padding: 8, borderBottom: '1px solid #eee' }}>
                          Quantidade
                        </th>
                        <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>
                          Unidade
                        </th>
                        {includeRaw && (
                          <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>
                            Raw (item)
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {(o.items ?? []).map((it) => (
                        <tr key={it.omieItemCode}>
                          <td style={{ padding: 8, borderBottom: '1px solid #f5f5f5' }}>
                            {it.description}
                          </td>
                          <td
                            style={{
                              padding: 8,
                              borderBottom: '1px solid #f5f5f5',
                              textAlign: 'right',
                              fontWeight: 700,
                            }}
                          >
                            {it.quantity}
                          </td>
                          <td style={{ padding: 8, borderBottom: '1px solid #f5f5f5' }}>
                            {it.unit ?? ''}
                          </td>

                          {includeRaw && (
                            <td style={{ padding: 8, borderBottom: '1px solid #f5f5f5' }}>
                              {it.rawPayload ? (
                                <details>
                                  <summary>ver</summary>
                                  <pre style={{ whiteSpace: 'pre-wrap' }}>
                                    {safeJson(it.rawPayload)}
                                  </pre>
                                </details>
                              ) : (
                                <span style={{ color: '#999' }}>—</span>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Raw payload (order) */}
                {includeRaw && isExpanded && (
                  <div style={{ marginTop: 12 }}>
                    <details open>
                      <summary style={{ cursor: 'pointer', fontWeight: 700 }}>
                        rawPayload do pedido
                      </summary>
                      <pre style={{ whiteSpace: 'pre-wrap' }}>{safeJson(o.rawPayload)}</pre>
                    </details>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination controls */}
      <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
        <button onClick={goFirst} disabled={loading || page === 1}>
          « Primeiro
        </button>
        <button onClick={goPrev} disabled={loading || page === 1}>
          ‹ Anterior
        </button>

        <span style={{ alignSelf: 'center', color: '#444' }}>
          Página <b>{page}</b> / <b>{totalPages}</b>
        </span>

        <button onClick={goNext} disabled={loading || page >= totalPages}>
          Próximo ›
        </button>
        <button onClick={goLast} disabled={loading || page >= totalPages}>
          Último »
        </button>
      </div>

      {/* Small note */}
      <p style={{ marginTop: 12, color: '#777' }}>
        Dica: use <b>includeRaw</b> apenas quando precisar depurar. Pode deixar a resposta bem grande.
      </p>
    </div>
  )
}
