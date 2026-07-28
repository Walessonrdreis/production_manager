import { useEffect, useMemo, useState } from 'react'
import { fetchStage20Totals, type Stage20Total } from '../lib/ordersApi'

export function Stage20TotalsPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<Stage20Total[]>([])
  const [q, setQ] = useState('')

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchStage20Totals()
      setRows(res.data)
    } catch (e: any) {
      setError(e?.message ?? 'Erro ao carregar totais')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return rows
    return rows.filter((r) => r.description.toLowerCase().includes(query))
  }, [rows, q])

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h1 style={{ margin: 0 }}>Totais — Etapa 20</h1>
        <button onClick={load} disabled={loading}>Recarregar</button>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filtrar por descrição..."
          style={{ padding: 6, minWidth: 260 }}
        />
      </div>

      {error && (
        <div style={{ padding: 12, background: '#ffecec', color: '#900', borderRadius: 6, marginTop: 12 }}>
          {error}
        </div>
      )}

      {loading && <p>Carregando...</p>}

      {!loading && (
        <p style={{ marginTop: 8, color: '#666' }}>
          Itens: <b>{filtered.length}</b>
        </p>
      )}

      {!loading && filtered.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Descrição</th>
              <th style={{ textAlign: 'right', borderBottom: '1px solid #ddd', padding: 8 }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.description}>
                <td style={{ borderBottom: '1px solid #f0f0f0', padding: 8 }}>{r.description}</td>
                <td style={{ borderBottom: '1px solid #f0f0f0', padding: 8, textAlign: 'right' }}>
                  <b>{r.totalQuantity}</b>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!loading && filtered.length === 0 && <p>Nenhum resultado.</p>}
    </div>
  )
}