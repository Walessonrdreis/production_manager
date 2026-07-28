type Props = {
  search: string;
  onChangeSearch: (value: string) => void;
  family: string;
  onChangeFamily: (value: string) => void;
  families: string[];
  stockCacheUpdatedAt: string | null;
  refreshing: boolean;
  onRefreshStock: () => void;
};

export function OmieCatalogFilters({
  search,
  onChangeSearch,
  family,
  onChangeFamily,
  families,
  stockCacheUpdatedAt,
  refreshing,
  onRefreshStock,
}: Props) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        gap: '1rem',
        flexWrap: 'wrap',
        marginBottom: '1rem',
      }}
    >
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.25rem' }}>Buscar</label>
          <input
            type="text"
            placeholder="Buscar por descrição, código, SKU ou família..."
            value={search}
            onChange={(e) => onChangeSearch(e.target.value)}
            style={{
              padding: '0.5rem',
              width: '320px',
              fontSize: '1rem',
              borderRadius: '4px',
              border: '1px solid #ccc',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.25rem' }}>Família</label>
          <select
            value={family}
            onChange={(e) => onChangeFamily(e.target.value)}
            style={{
              padding: '0.5rem',
              minWidth: '220px',
              fontSize: '1rem',
              borderRadius: '4px',
              border: '1px solid #ccc',
            }}
          >
            <option value="">Todas as famílias</option>
            {families.map((familyOption) => (
              <option key={familyOption} value={familyOption}>
                {familyOption}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
        <div style={{ color: '#475569', fontSize: '0.9rem' }}>
          Última atualização do estoque:{' '}
          <strong>
            {stockCacheUpdatedAt ? new Date(stockCacheUpdatedAt).toLocaleString('pt-BR') : 'Ainda não carregado'}
          </strong>
        </div>

        <button
          type="button"
          onClick={onRefreshStock}
          disabled={refreshing}
          style={{
            padding: '0.5rem 0.9rem',
            backgroundColor: refreshing ? '#94a3b8' : '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: refreshing ? 'not-allowed' : 'pointer',
            fontWeight: 600,
          }}
        >
          {refreshing ? 'Atualizando...' : 'Atualizar estoque agora'}
        </button>
      </div>
    </div>
  );
}