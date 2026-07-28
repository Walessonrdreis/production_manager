# 📦 Shared Library — Estratégias de Integração

Centraliza padrões reutilizáveis de integração com APIs paginadas (Omie).

## Estrutura

```
shared/integration/strategies/
├── types.ts              # SyncStateStoreContract, RetryOptions, PaginationMeta
├── retry.strategy.ts     # fetchPageWithRetry(), sleep(), extractRedundantWaitSeconds()
├── sync-state.store.ts   # PrismaSyncStateStore (genérico, reutilizável)
└── index.ts              # Barrel
```

## Componentes

### `fetchPageWithRetry(fetchFn, options)`

Executa uma função de fetch com retry adaptativo:

- **Erro comum**: Backoff exponencial (1s, 2s, 3s) até `maxAttempts` (default: 3)
- **Consumo redundante**: Detecta erro Omie, extrai tempo de espera, aguarda +2s, retenta
- **Recuperação**: Loga checkpoint com contagem de attempts/waits

```ts
import { fetchPageWithRetry } from "@shared/integration/strategies/retry.strategy";

const result = await fetchPageWithRetry(
  () => gateway.fetchPage({ page, pageSize, updatedSince }),
  { label: "product-structure", externalRequestId, page, pageSize }
);
```

### `PrismaSyncStateStore(delegate, id?)`

Store de checkpoint de sincronização incremental. Aceita qualquer delegate Prisma.

```ts
import { PrismaSyncStateStore } from "@shared/integration/strategies/sync-state.store";

const store = new PrismaSyncStateStore(prisma.salesOrderSyncState, "GLOBAL");
const state = await store.getState();
await store.updateLastSync(new Date());
```

### Tipos

```ts
import type { SyncStateStoreContract, RetryOptions, PaginationMeta } from "@shared/integration/strategies/types";
```

## Próximos passos

1. Refatorar `sales-order-sync` para usar a shared
2. Refatorar `customer-sync` para usar a shared
3. Refatorar `product-stock-fetch` para usar a shared
4. Evoluir `product-structure` com `fetchPageWithRetry` + `PrismaSyncStateStore`
