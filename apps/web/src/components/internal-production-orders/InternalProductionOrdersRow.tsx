import { Pencil, Trash2 } from 'lucide-react';
import type { InternalProductionOrder } from '../../hooks/api/useInternalProductionOrders';

type Props = {
  order: InternalProductionOrder
  onStart: (id: string) => void
  onComplete: (id: string) => void
  onEdit: (order: InternalProductionOrder) => void
  onDelete: (id: string) => void
  isStarting: boolean
  isCompleting: boolean
}

function isTrello(order: InternalProductionOrder): boolean {
  return order.source === 'TRELLO' || !!order.trelloCardId;
}

function needsReview(order: InternalProductionOrder): boolean {
  if (order.omieCode && !order.productDescription) return true;
  if (order.omieCode && order.stockQuantity === null) return true;
  if (!order.parsedProductName && !order.productDescription) return true;
  return false;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

function formatQuantity(value: number, unit: string): string {
  return `${value} ${unit}`;
}

function formatStock(val: number | null): string {
  if (val === null) return '-';
  return String(val);
}

export function InternalProductionOrdersRow({
  order,
  onStart,
  onComplete,
  onEdit,
  onDelete,
  isStarting,
  isCompleting,
}: Props) {
  const fromTrello = isTrello(order);
  const review = needsReview(order);

  const tdStyle: React.CSSProperties = {
    padding: '0.75rem',
    border: '1px solid #ddd',
    verticalAlign: 'middle',
  };

  return (
    <tr
      style={{
        opacity: order.completedAt ? 0.6 : 1,
        backgroundColor: review ? '#fffbeb' : undefined,
        transition: 'background-color 0.15s ease',
      }}
      onMouseEnter={(e) => {
        if (!review) {
          (e.currentTarget as HTMLElement).style.backgroundColor = '#f8fafc';
        }
      }}
      onMouseLeave={(e) => {
        if (!review) {
          (e.currentTarget as HTMLElement).style.backgroundColor = '';
        }
      }}
    >
      <td style={tdStyle}>
        {fromTrello ? (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontWeight: 600,
              backgroundColor: '#e0f2fe',
              color: '#0369a1',
            }}
          >
            Trello
          </span>
        ) : (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontWeight: 600,
              backgroundColor: '#f3f4f6',
              color: '#6b7280',
            }}
          >
            Manual
          </span>
        )}
      </td>

      <td style={tdStyle}>
        <span style={{ fontWeight: 500 }}>{order.title}</span>
        {review && (
          <span
            title="Precisa de revisão"
            style={{
              marginLeft: '6px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              backgroundColor: '#f59e0b',
              color: 'white',
              fontSize: '0.625rem',
              fontWeight: 700,
            }}
          >
            !
          </span>
        )}
      </td>

      <td style={tdStyle}>
        <code style={{ fontSize: '0.8125rem' }}>{order.lote}</code>
      </td>

      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
        {formatQuantity(order.quantityValue, order.quantityUnit)}
      </td>

      <td style={tdStyle}>
        {order.parsedProductName || order.productDescription || (
          <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>
            {order.omieCode ? 'não encontrado' : 'sem descrição'}
          </span>
        )}
      </td>

      <td style={tdStyle}>
        {order.omieCode ? (
          <code style={{ fontSize: '0.8125rem' }}>{order.omieCode}</code>
        ) : (
          <span style={{ color: '#9ca3af' }}>-</span>
        )}
      </td>

      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
        {order.stockQuantity !== null ? (
          <span>
            {formatStock(order.stockQuantity)}
            {order.minimumStock !== null && (
              <span style={{ color: '#6b7280', fontSize: '0.75rem', marginLeft: '4px' }}>
                / min {order.minimumStock}
              </span>
            )}
          </span>
        ) : (
          <span style={{ color: '#9ca3af' }}>-</span>
        )}
      </td>

      <td style={tdStyle}>{formatDate(order.startedAt)}</td>

      <td style={tdStyle}>{formatDate(order.completedAt)}</td>

      <td style={{ ...tdStyle, textAlign: 'center', whiteSpace: 'nowrap' }}>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', justifyContent: 'center' }}>
          {!order.startedAt && (
            <button
              onClick={() => onStart(order.id)}
              disabled={isStarting}
              title="Iniciar produção"
              style={{
                padding: '0.3rem 0.6rem',
                fontSize: '0.75rem',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isStarting ? 'not-allowed' : 'pointer',
              }}
            >
              Iniciar
            </button>
          )}
          {order.startedAt && !order.completedAt && (
            <button
              onClick={() => onComplete(order.id)}
              disabled={isCompleting}
              title="Completar produção"
              style={{
                padding: '0.3rem 0.6rem',
                fontSize: '0.75rem',
                backgroundColor: '#16a34a',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isCompleting ? 'not-allowed' : 'pointer',
              }}
            >
              Completar
            </button>
          )}
          {order.completedAt && (
            <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>Concluído</span>
          )}

          <button
            onClick={() => onEdit(order)}
            title="Editar"
            style={{
              padding: '0.3rem',
              fontSize: '0.75rem',
              backgroundColor: 'transparent',
              color: '#6b7280',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Pencil size={14} />
          </button>

          <button
            onClick={() => onDelete(order.id)}
            title="Excluir"
            style={{
              padding: '0.3rem',
              fontSize: '0.75rem',
              backgroundColor: 'transparent',
              color: '#ef4444',
              border: '1px solid #fca5a5',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}
