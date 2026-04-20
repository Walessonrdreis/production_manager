import { safeJson } from '../../domain/orders/utils'
import type { Order } from '../../lib/ordersApi'
import { OrderItemsTable } from './OrderItemsTable'

type Props = {
  order: Order
  includeRaw: boolean
  isExpanded: boolean
  onToggleExpanded: (omieCode: string) => void
}

export function OrderCard({ order, includeRaw, isExpanded, onToggleExpanded }: Props) {
  const title = order.numeroPedido ? `Pedido #${order.numeroPedido}` : `Pedido ${order.omieCode}`

  return (
    <div
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
          <b>Etapa:</b> {order.etapa}
        </span>

        <span style={{ color: '#444' }}>
          <b>Cancelado:</b> {order.cancelado}
        </span>

        <span style={{ color: '#444' }}>
          <b>Encerrado:</b> {order.encerrado}
        </span>

        {order.dataPrevisao && (
          <span style={{ color: '#444' }}>
            <b>Prev:</b> {new Date(order.dataPrevisao).toLocaleDateString()}
          </span>
        )}

        {order.lastSyncAt && (
          <span style={{ color: '#444' }}>
            <b>Sync:</b> {new Date(order.lastSyncAt).toLocaleString()}
          </span>
        )}

        <span style={{ color: '#444' }}>
          <b>Itens:</b> {order.items?.length ?? 0}
        </span>

        {includeRaw && (
          <button onClick={() => onToggleExpanded(order.omieCode)} style={{ marginLeft: 'auto' }}>
            {isExpanded ? 'Ocultar rawPayload' : 'Ver rawPayload'}
          </button>
        )}
      </div>

      {/* Items */}
      <OrderItemsTable order={order} includeRaw={includeRaw} />

      {/* Raw payload (order) */}
      {includeRaw && isExpanded && (
        <div style={{ marginTop: 12 }}>
          <details open>
            <summary style={{ cursor: 'pointer', fontWeight: 700 }}>rawPayload do pedido</summary>
            <pre style={{ whiteSpace: 'pre-wrap' }}>{safeJson(order.rawPayload)}</pre>
          </details>
        </div>
      )}
    </div>
  )
}