// ---------------------------------------------------------------------------
// Shared Library — Estratégias de Integração
// ---------------------------------------------------------------------------
// Barrel file. Exporta tipos, funções e classes para consumo externo.
//
// Uso:
//   import { fetchPageWithRetry } from "@shared/integration/strategies/retry.strategy";
//   import { PrismaSyncStateStore } from "@shared/integration/strategies/sync-state.store";
// ---------------------------------------------------------------------------

export { fetchPageWithRetry, extractRedundantWaitSeconds, sleep } from "./retry.strategy";
export { PrismaSyncStateStore } from "./sync-state.store";
export { SyncHooksRunner } from "./sync-hooks";
export type { PrismaSyncDelegate } from "./sync-state.store";
export type { SyncStateStoreContract, RetryOptions, PaginationMeta, AfterSyncHook } from "./types";
