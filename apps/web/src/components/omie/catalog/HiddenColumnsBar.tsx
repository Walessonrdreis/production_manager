import type { ColumnKey } from '../../../domain/omie/catalogColumns';

function ChevronRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type ColumnDef = { key: ColumnKey; label: string };

type Props = {
  hiddenColumnList: ColumnDef[];
  onShowColumn: (key: ColumnKey) => void;
};

export function HiddenColumnsBar({ hiddenColumnList, onShowColumn }: Props) {
  if (hiddenColumnList.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.5rem',
        alignItems: 'center',
        marginBottom: '0.75rem',
        color: '#475569',
      }}
    >
      <div style={{ fontWeight: 700 }}>Colunas ocultas:</div>
      {hiddenColumnList.map((column) => (
        <button
          key={column.key}
          type="button"
          onClick={() => onShowColumn(column.key)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.35rem 0.6rem',
            borderRadius: '999px',
            border: '1px solid #cbd5e1',
            backgroundColor: 'white',
            cursor: 'pointer',
            fontWeight: 600,
            color: '#334155',
          }}
          title="Mostrar coluna"
        >
          <ChevronRightIcon />
          {column.label}
        </button>
      ))}
    </div>
  );
}