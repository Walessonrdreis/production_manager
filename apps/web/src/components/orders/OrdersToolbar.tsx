import { Link } from 'react-router-dom'
import { clamp } from '../../domain/orders/utils'

type Props = {
  loading: boolean
  syncing: boolean

  includeRaw: boolean
  onToggleIncludeRaw: (value: boolean) => void

  pageSize: number
  onChangePageSize: (value: number) => void

  q: string
  onChangeQuery: (value: string) => void

  onReload: () => void
  onSyncStage20: () => void
}

export function OrdersToolbar({
  loading,
  syncing,
  includeRaw,
  onToggleIncludeRaw,
  pageSize,
  onChangePageSize,
  q,
  onChangeQuery,
  onReload,
  onSyncStage20,
}: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <h1 style={{ margin: 0 }}>Ordens</h1>

      <button onClick={onSyncStage20} disabled={syncing || loading}>
        {syncing ? 'Sincronizando...' : 'Sincronizar etapa 20'}
      </button>

      <button onClick={onReload} disabled={loading || syncing}>
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
          onChange={(e) => onToggleIncludeRaw(e.target.checked)}
        />
        includeRaw
      </label>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        pageSize
        <select
          value={pageSize}
          onChange={(e) => onChangePageSize(clamp(Number(e.target.value), 1, 200))}
        >
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
          <option value={200}>200</option>
        </select>
      </label>

      <input
        value={q}
        onChange={(e) => onChangeQuery(e.target.value)}
        placeholder="Buscar (nº pedido, código, descrição item)..."
        style={{ padding: 6, minWidth: 320 }}
      />
    </div>
  )
}