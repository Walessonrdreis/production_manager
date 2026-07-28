type Props = {
  admin: {
    busyAction: string | null;
    searchQuery: string;
    setSearchQuery: (v: string) => void;
    searchRows: any[];
    searchTotal: number;
    searchPage: number;
    searchProducts: (page?: number) => void;
    setLookupId: (v: string) => void;
    setLookupCode: (v: string) => void;
  };
};

export function OmieSearch({ admin }: Props) {
  const totalPages = Math.max(1, Math.ceil(admin.searchTotal / 20));

  return (
    <section style={{ marginTop: 20 }}>
      <h2>Busca de Produtos</h2>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input
          value={admin.searchQuery}
          onChange={(e) => admin.setSearchQuery(e.target.value)}
          placeholder="Buscar por descrição, SKU ou família"
          style={{ padding: 6, minWidth: 320 }}
        />
        <button onClick={() => admin.searchProducts(1)} disabled={admin.busyAction !== null}>
          {admin.busyAction === 'search-products' ? 'Buscando...' : 'Buscar'}
        </button>
      </div>

      {admin.searchRows.length > 0 && (
        <>
          <p style={{ marginTop: 8, color: '#555' }}>
            Total: {admin.searchTotal} | Página {admin.searchPage} de {totalPages}
          </p>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: 8, borderBottom: '1px solid #ddd' }}>Descrição</th>
                  <th style={{ padding: 8, borderBottom: '1px solid #ddd' }}>SKU</th>
                  <th style={{ padding: 8, borderBottom: '1px solid #ddd' }}>Família</th>
                  <th style={{ padding: 8, borderBottom: '1px solid #ddd' }}>Ativo</th>
                  <th style={{ padding: 8, borderBottom: '1px solid #ddd' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {admin.searchRows.map((row) => (
                  <tr key={row.id}>
                    <td style={{ padding: 8 }}>{row.description}</td>
                    <td style={{ padding: 8 }}>{row.sku ?? '-'}</td>
                    <td style={{ padding: 8 }}>{row.familyDescription ?? '-'}</td>
                    <td style={{ padding: 8 }}>{row.active ? 'Sim' : 'Não'}</td>
                    <td style={{ padding: 8 }}>
                      <button
                        onClick={() => {
                          admin.setLookupId(row.id);
                          if (row.omieCode) admin.setLookupCode(row.omieCode);
                        }}
                      >
                        Preencher consulta
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
``