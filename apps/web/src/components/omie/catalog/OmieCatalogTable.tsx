import type { ColumnKey } from '../../../domain/omie/catalogColumns';
import type { OmieCatalogProduct } from '../../../hooks/omie/useOmieCatalog';

function ChevronLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type ColumnDef = { key: ColumnKey; label: string; width: number; align?: 'left' | 'center' | 'right' };

type Props = {
  products: OmieCatalogProduct[];
  visibleColumns: ColumnDef[];

 tableScrollRef: React.RefObject<HTMLDivElement>;

  selectedIds: Set<string>;
  isAllVisibleSelected: boolean;

  onToggleSelectAllVisible: () => void;
  onToggleSelected: (id: string) => void;

  onHideColumn: (key: ColumnKey) => void;

  selectingSingle: boolean;
  onAddSingle: (omieProductId: string) => void;
};

export function OmieCatalogTable({
  products,
  visibleColumns,
  tableScrollRef,
  selectedIds,
  isAllVisibleSelected,
  onToggleSelectAllVisible,
  onToggleSelected,
  onHideColumn,
  selectingSingle,
  onAddSingle,
}: Props) {
  return (
    <div
      ref={tableScrollRef}
      style={{
        overflowX: 'auto',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
      }}
    >
      <table style={{ width: 'max-content', borderCollapse: 'collapse', marginBottom: 0, tableLayout: 'fixed' }}>
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5', textAlign: 'left' }}>
            <th style={{ padding: '0.75rem', border: '1px solid #ddd', width: '52px', textAlign: 'center' }}>
              <input
                type="checkbox"
                checked={isAllVisibleSelected}
                onChange={onToggleSelectAllVisible}
                aria-label="Selecionar todos visíveis"
              />
            </th>

            {visibleColumns.map((column) => (
              <th
                key={column.key}
                style={{
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  width: `${column.width}px`,
                  minWidth: `${column.width}px`,
                  maxWidth: `${column.width}px`,
                  textAlign: column.align ?? 'left',
                  whiteSpace: 'nowrap',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'center' }}>
                  <span>{column.label}</span>

                  {column.key !== 'description' ? (
                    <button
                      type="button"
                      onClick={() => onHideColumn(column.key)}
                      title="Ocultar coluna"
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: 'white',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0,
                        color: '#334155',
                      }}
                    >
                      <ChevronLeftIcon />
                    </button>
                  ) : (
                    <div style={{ width: '28px', height: '28px' }} />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td style={{ padding: '0.75rem', border: '1px solid #ddd', textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={selectedIds.has(product.id)}
                  onChange={() => onToggleSelected(product.id)}
                  aria-label={`Selecionar ${product.description}`}
                />
              </td>

              {visibleColumns.map((column) => {
                if (column.key === 'code') {
                  return (
                    <td
                      key={column.key}
                      style={{
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        fontFamily: 'monospace',
                        width: `${column.width}px`,
                        minWidth: `${column.width}px`,
                        maxWidth: `${column.width}px`,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {product.code || product.omieId}
                    </td>
                  );
                }

                if (column.key === 'description') {
                  return (
                    <td
                      key={column.key}
                      style={{
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        width: `${column.width}px`,
                        minWidth: `${column.width}px`,
                        maxWidth: `${column.width}px`,
                        whiteSpace: 'normal',
                        overflow: 'visible',
                        textOverflow: 'clip',
                        wordBreak: 'break-word',
                      }}
                    >
                      {product.description}
                    </td>
                  );
                }

                if (column.key === 'family') {
                  return (
                    <td
                      key={column.key}
                      style={{
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        width: `${column.width}px`,
                        minWidth: `${column.width}px`,
                        maxWidth: `${column.width}px`,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {product.familyDescription ?? '-'}
                    </td>
                  );
                }

                if (column.key === 'sku') {
                  return (
                    <td
                      key={column.key}
                      style={{
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        width: `${column.width}px`,
                        minWidth: `${column.width}px`,
                        maxWidth: `${column.width}px`,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {product.sku || '-'}
                    </td>
                  );
                }

                if (column.key === 'stock') {
                  return (
                    <td
                      key={column.key}
                      style={{
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        width: `${column.width}px`,
                        minWidth: `${column.width}px`,
                        maxWidth: `${column.width}px`,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {product.stockQuantity ?? 'Não informado'}
                    </td>
                  );
                }

                if (column.key === 'minimumStock') {
                  return (
                    <td
                      key={column.key}
                      style={{
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        width: `${column.width}px`,
                        minWidth: `${column.width}px`,
                        maxWidth: `${column.width}px`,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {product.minimumStock ?? 'Não informado'}
                    </td>
                  );
                }

                if (column.key === 'status') {
                  return (
                    <td
                      key={column.key}
                      style={{
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        textAlign: 'center',
                        width: `${column.width}px`,
                        minWidth: `${column.width}px`,
                        maxWidth: `${column.width}px`,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <span
                        title={product.active ? 'Ativo' : 'Inativo'}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '28px',
                          height: '28px',
                          borderRadius: '999px',
                          backgroundColor: product.active ? '#e6ffe6' : '#ffe6e6',
                          color: product.active ? '#006600' : '#cc0000',
                          fontWeight: 800,
                        }}
                      >
                        {product.active ? '✓' : '×'}
                      </span>
                    </td>
                  );
                }

                // action
                return (
                  <td
                    key={column.key}
                    style={{
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      textAlign: 'center',
                      width: `${column.width}px`,
                      minWidth: `${column.width}px`,
                      maxWidth: `${column.width}px`,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <button
                      onClick={() => onAddSingle(product.id)}
                      disabled={selectingSingle}
                      style={{
                        padding: '0.4rem 0.8rem',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: selectingSingle ? 'not-allowed' : 'pointer',
                        opacity: selectingSingle ? 0.7 : 1,
                      }}
                    >
                      Adicionar
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}

          {products.length === 0 && (
            <tr>
              <td colSpan={1 + visibleColumns.length} style={{ padding: '1rem', textAlign: 'center', border: '1px solid #ddd' }}>
                Nenhum produto encontrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}