type Props = {
  admin: {
    busyAction: string | null;
    categoriesQuery: string;
    setCategoriesQuery: (v: string) => void;
    categories: string[];
    loadCategories: () => void;
  };
};

export function OmieCategories({ admin }: Props) {
  return (
    <section style={{ marginTop: 20 }}>
      <h2>Categorias</h2>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input
          value={admin.categoriesQuery}
          onChange={(e) => admin.setCategoriesQuery(e.target.value)}
          placeholder="Filtro de categoria (opcional)"
          style={{ padding: 6, minWidth: 280 }}
        />
        <button onClick={admin.loadCategories} disabled={admin.busyAction !== null}>
          {admin.busyAction === 'categories' ? 'Carregando...' : 'Buscar Categorias'}
        </button>
      </div>

      {admin.categories.length > 0 && (
        <ul style={{ marginTop: 10 }}>
          {admin.categories.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      )}
    </section>
  );
}