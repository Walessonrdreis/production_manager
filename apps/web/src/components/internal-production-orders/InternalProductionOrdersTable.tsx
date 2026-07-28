import type { InternalProductionOrder } from '../../hooks/api/useInternalProductionOrders';
import { InternalProductionOrdersRow } from './InternalProductionOrdersRow';

type Props = {
  orders: InternalProductionOrder[]
  onStart: (id: string) => void
  onComplete: (id: string) => void
  onEdit: (order: InternalProductionOrder) => void
  onDelete: (id: string) => void
  isStarting: boolean
  isCompleting: boolean
}

export function InternalProductionOrdersTable({
  orders,
  onStart,
  onComplete,
  onEdit,
  onDelete,
  isStarting,
  isCompleting,
}: Props) {
  return (
    <div
      style={{
        overflowX: 'auto',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        marginTop: '1rem',
      }}
    >
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          minWidth: '1100px',
        }}
      >
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5', textAlign: 'left' }}>
            <th style={{ padding: '0.75rem', border: '1px solid #ddd' }}>Origem</th>
            <th style={{ padding: '0.75rem', border: '1px solid #ddd' }}>Título</th>
            <th style={{ padding: '0.75rem', border: '1px solid #ddd' }}>Lote</th>
            <th style={{ padding: '0.75rem', border: '1px solid #ddd' }}>Quantidade</th>
            <th style={{ padding: '0.75rem', border: '1px solid #ddd' }}>Produto</th>
            <th style={{ padding: '0.75rem', border: '1px solid #ddd' }}>Cód. Omie</th>
            <th style={{ padding: '0.75rem', border: '1px solid #ddd' }}>Estoque</th>
            <th style={{ padding: '0.75rem', border: '1px solid #ddd' }}>Início</th>
            <th style={{ padding: '0.75rem', border: '1px solid #ddd' }}>Fim</th>
            <th style={{ padding: '0.75rem', border: '1px solid #ddd', width: '150px' }}>Ações</th>
          </tr>
        </thead>

        <tbody>
          {orders.map((order) => (
            <InternalProductionOrdersRow
              key={order.id}
              order={order}
              onStart={onStart}
              onComplete={onComplete}
              onEdit={onEdit}
              onDelete={onDelete}
              isStarting={isStarting}
              isCompleting={isCompleting}
            />
          ))}

          {orders.length === 0 && (
            <tr>
              <td
                colSpan={10}
                style={{
                  padding: '1rem',
                  textAlign: 'center',
                  border: '1px solid #ddd',
                }}
              >
                Nenhuma ordem de produção interna encontrada.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
