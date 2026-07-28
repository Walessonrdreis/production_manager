type Props = {
  selectedCount: number;
  visibleCount: number;
  bulkPending: boolean;
  onSelectAllVisible: () => void;
  onBulkAdd: () => void;
  onClearSelection: () => void;
};

export function OmieCatalogSelectionBar({
  selectedCount,
  visibleCount,
  bulkPending,
  onSelectAllVisible,
  onBulkAdd,
  onClearSelection,
}: Props) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        flexWrap: 'wrap',
        marginBottom: '0.75rem',
      }}
    >
      <div style={{ color: '#475569' }}>
        Selecionados: <strong>{selectedCount}</strong>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={onSelectAllVisible}
          disabled={visibleCount === 0}
          style={{
            padding: '0.45rem 0.8rem',
            backgroundColor: '#0f766e',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: visibleCount === 0 ? 'not-allowed' : 'pointer',
            fontWeight: 600,
          }}
        >
          Selecionar tudo
        </button>

        <button
          type="button"
          onClick={onBulkAdd}
          disabled={selectedCount === 0 || bulkPending}
          style={{
            padding: '0.45rem 0.8rem',
            backgroundColor: selectedCount === 0 || bulkPending ? '#94a3b8' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: selectedCount === 0 || bulkPending ? 'not-allowed' : 'pointer',
            fontWeight: 600,
          }}
        >
          {bulkPending ? 'Adicionando...' : 'Adicionar selecionados'}
        </button>

        <button
          type="button"
          onClick={onClearSelection}
          disabled={selectedCount === 0}
          style={{
            padding: '0.45rem 0.8rem',
            backgroundColor: 'white',
            color: '#334155',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            cursor: selectedCount === 0 ? 'not-allowed' : 'pointer',
            fontWeight: 600,
          }}
        >
          Limpar
        </button>
      </div>
    </div>
  );
}