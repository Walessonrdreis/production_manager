type Props = {
  admin: {
    busyAction: string | null;

    includeRaw: boolean;
    setIncludeRaw: (v: boolean) => void;

    lookupId: string;
    setLookupId: (v: string) => void;
    lookupCode: string;
    setLookupCode: (v: string) => void;

    lookupById: () => void;
    lookupByCode: () => void;

    productDetails: any;
    productStock: any;

    safeJson: (v: unknown) => string;
  };
};

export function OmieLookup({ admin }: Props) {
  return (
    <section style={{ marginTop: 20 }}>
      <h2>Consulta de Produto</h2>

      <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
        <input
          type="checkbox"
          checked={admin.includeRaw}
          onChange={(e) => admin.setIncludeRaw(e.target.checked)}
        />
        includeRaw no endpoint de detalhes
      </label>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input
          value={admin.lookupId}
          onChange={(e) => admin.setLookupId(e.target.value)}
          placeholder="ID (UUID)"
          style={{ padding: 6, minWidth: 260 }}
        />
        <button onClick={admin.lookupById} disabled={admin.busyAction !== null}>
          Consultar por ID
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
        <input
          value={admin.lookupCode}
          onChange={(e) => admin.setLookupCode(e.target.value)}
          placeholder="Código OMIE"
          style={{ padding: 6, minWidth: 260 }}
        />
        <button onClick={admin.lookupByCode} disabled={admin.busyAction !== null}>
          Consultar por Código
        </button>
      </div>

      {admin.productDetails && (
        <div style={{ marginTop: 12 }}>
          <h3>Detalhes</h3>
          <pre style={{ background: '#f8fafc', padding: 10, borderRadius: 6 }}>
            {admin.safeJson(admin.productDetails)}
          </pre>
        </div>
      )}

      {admin.productStock && (
        <div style={{ marginTop: 12 }}>
          <h3>Estoque</h3>
          <pre style={{ background: '#f8fafc', padding: 10, borderRadius: 6 }}>
            {admin.safeJson(admin.productStock)}
          </pre>
        </div>
      )}
    </section>
  );
}
``