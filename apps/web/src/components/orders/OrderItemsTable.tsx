import { safeJson } from '../../domain/orders/utils'
import type { Order } from '../../lib/ordersApi'

type Props = {
  order: Order
  includeRaw: boolean
}

export function OrderItemsTable({ order, includeRaw }: Props) {
  return (
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
          {(order.items ?? []).map((it) => (
            <tr key={it.omieItemCode}>
              <td style={{ padding: 8, borderBottom: '1px solid #f5f5f5' }}>{it.description}</td>
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
              <td style={{ padding: 8, borderBottom: '1px solid #f5f5f5' }}>{it.unit ?? ''}</td>

              {includeRaw && (
                <td style={{ padding: 8, borderBottom: '1px solid #f5f5f5' }}>
                  {it.rawPayload ? (
                    <details>
                      <summary>ver</summary>
                      <pre style={{ whiteSpace: 'pre-wrap' }}>{safeJson(it.rawPayload)}</pre>
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
  )
}