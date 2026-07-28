type Props = {
  admin: {
    busyAction: string | null;
    syncProducts: () => void;
    refreshStock: () => void;
    pingStage20: () => void;
    loadStockInfo: () => void;
    stockInfo: any;
  };
};

export function OmieActions({ admin }: Props) {
  const { busyAction } = admin;

  return (
    <section style={{ marginTop: 16 }}>
      <h2>Ações</h2>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={admin.syncProducts} disabled={busyAction !== null}>
          {busyAction === 'sync-products' ? 'Sincronizando...' : 'Sync Produtos OMIE'}
        </button>

        <button onClick={admin.refreshStock} disabled={busyAction !== null}>
          {busyAction === 'refresh-stock' ? 'Atualizando...' : 'Refresh Estoque'}
        </button>

        <button onClick={admin.pingStage20} disabled={busyAction !== null}>
          {busyAction === 'ping-stage20' ? 'Consultando...' : 'Ping Stage 20'}
        </button>

        <button onClick={admin.loadStockInfo} disabled={busyAction !== null}>
          {busyAction === 'stock-info' ? 'Consultando...' : 'Info de Estoque'}
        </button>
      </div>

      {admin.stockInfo && (
        <div style={{ marginTop: 10 }}>
          <b>Último refresh:</b> {admin.stockInfo.lastRefreshAt ?? '-'} |{' '}
          <b>Total itens:</b> {admin.stockInfo.totalItems} |{' '}
          <b>Fonte:</b> {admin.stockInfo.source}
        </div>
      )}
    </section>
  );
}
``