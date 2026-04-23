import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchStage20Orders, type Stage20Order } from '../lib/ordersApi'

function formatDate(value: string | null) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('pt-BR')
}

export function Stage20OrdersPage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [q, setQ] = useState('')
  const [query, setQuery] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [orders, setOrders] = useState<Stage20Order[]>([])
  const [total, setTotal] = useState(0)

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(total / pageSize))
  }, [total, pageSize])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const response = await fetchStage20Orders({
        page,
        pageSize,
        q: query,
      })
      setOrders(response.data)
      setTotal(response.meta.total ?? 0)
    } catch (e: any) {
      setError(e?.message ?? 'Erro ao carregar pedidos da etapa 20')
      setOrders([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [page, pageSize, query])

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0 }}>Pedidos Etapa 20</h1>
        <Link to="/orders">Voltar para Ordens</Link>
        <button onClick={load} disabled={loading}>
          {loading ? 'Carregando...' : 'Recarregar'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por descrição dos itens..."
          style={{ padding: 6, minWidth: 320 }}
        />
        <button
          onClick={() => {
            setPage(1)
            setQuery(q.trim())
          }}
          disabled={loading}
        >
          Buscar
        </button>
        <button
          onClick={() => {
            setQ('')
            setQuery('')
            setPage(1)
          }}
          disabled={loading}
        >
          Limpar
        </button>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          pageSize
          <select
            value={pageSize}
            onChange={(e) => {
              setPage(1)
              setPageSize(Number(e.target.value))
            }}
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
          </select>
        </label>
      </div>

      <p style={{ marginTop: 10, color: '#666' }}>
        Total: <b>{total}</b> | Página <b>{page}</b> de <b>{totalPages}</b>
      </p>

      {error && (
        <div style={{ marginTop: 10, color: '#8a1c1c', background: '#ffecec', padding: 10, borderRadius: 6 }}>
          {error}
        </div>
      )}

      {!loading && orders.length > 0 && (
        <div style={{ overflowX: 'auto', marginTop: 10 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #ddd' }}>Pedido</th>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #ddd' }}>Código</th>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #ddd' }}>Itens</th>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #ddd' }}>Último Sync</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td style={{ padding: 8, borderBottom: '1px solid #f2f2f2' }}>{order.numeroPedido ?? '-'}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #f2f2f2' }}>{order.omieCode}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #f2f2f2' }}>
                    {(order.items ?? []).map((item) => `${item.description} (${item.quantity})`).join(', ')}
                  </td>
                  <td style={{ padding: 8, borderBottom: '1px solid #f2f2f2' }}>{formatDate(order.lastSyncAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && orders.length === 0 && <p>Nenhum pedido encontrado.</p>}

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button onClick={() => setPage(1)} disabled={loading || page === 1}>
          Primeiro
        </button>
        <button onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={loading || page === 1}>
          Anterior
        </button>
        <button
          onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          disabled={loading || page >= totalPages}
        >
          Próximo
        </button>
        <button onClick={() => setPage(totalPages)} disabled={loading || page >= totalPages}>
          Último
        </button>
      </div>
    </div>
  )
}
