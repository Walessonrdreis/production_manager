type Props = {
  daysCount: number;
  totalEntries: number;
  totalQuantity: number;
};

export function PlanStatsCards({ daysCount, totalEntries, totalQuantity }: Props) {
  const cardStyle: React.CSSProperties = {
    border: '1px solid #d0d7de',
    borderRadius: '12px',
    padding: '1rem',
    backgroundColor: 'white',
  };

  const labelStyle: React.CSSProperties = { color: '#57606a', fontSize: '0.875rem' };
  const valueStyle: React.CSSProperties = { fontSize: '1.75rem', fontWeight: 700 };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
      <div style={cardStyle}>
        <div style={labelStyle}>Dias no plano</div>
        <div style={valueStyle}>{daysCount}</div>
      </div>

      <div style={cardStyle}>
        <div style={labelStyle}>Itens visíveis</div>
        <div style={valueStyle}>{totalEntries}</div>
      </div>

      <div style={cardStyle}>
        <div style={labelStyle}>Quantidade visível</div>
        <div style={valueStyle}>{totalQuantity}</div>
      </div>
    </div>
  );
}