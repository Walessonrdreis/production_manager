import type { Order } from '../../lib/ordersApi'
import { OrderCard } from './OrderCard'

type Props = {
  orders: Order[]
  includeRaw: boolean
  expanded: Record<string, boolean>
  onToggleExpanded: (omieCode: string) => void
}

export function OrdersList({ orders, includeRaw, expanded, onToggleExpanded }: Props) {
  return (
    <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
      {orders.map((o) => (
        <OrderCard
          key={o.omieCode}
          order={o}
          includeRaw={includeRaw}
          isExpanded={!!expanded[o.omieCode]}
          onToggleExpanded={onToggleExpanded}
        />
      ))}
    </div>
  )
}