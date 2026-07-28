type Props = { family: string };

export function OmieCatalogNote({ family }: Props) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <input
        type="text"
        readOnly
        value={`Atualização automática a cada 15 minutos${family ? ` • Família: ${family}` : ''}`}
        style={{
          padding: '0.5rem',
          width: '420px',
          fontSize: '0.95rem',
          borderRadius: '4px',
          border: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc',
          color: '#475569',
        }}
      />
    </div>
  );
}