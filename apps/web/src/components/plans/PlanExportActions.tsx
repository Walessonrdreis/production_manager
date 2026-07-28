type Props = {
  onExportCsv: () => void;
  onExportPdf: () => void;
};

export function PlanExportActions({ onExportCsv, onExportPdf }: Props) {
  return (
    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
      <button
        onClick={onExportCsv}
        style={{
          padding: '0.65rem 1rem',
          backgroundColor: '#17a2b8',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: 600,
        }}
      >
        Exportar CSV
      </button>

      <button
        onClick={onExportPdf}
        style={{
          padding: '0.65rem 1rem',
          backgroundColor: '#6f42c1',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: 600,
        }}
      >
        Gerar PDF
      </button>
    </div>
  );
}