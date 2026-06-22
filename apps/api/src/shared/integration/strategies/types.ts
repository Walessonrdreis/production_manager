// ---------------------------------------------------------------------------
// Tipos Compartilhados — Estratégias de Integração Paginada
// ---------------------------------------------------------------------------

/**
 * Contrato para store de estado de sincronização.
 *
 * Permite que o sync opere de forma incremental, persistindo o timestamp
 * da última execução bem-sucedida.
 */
export type SyncStateStoreContract = {
    getState(): Promise<{ id: string; lastSyncAt: Date }>;
    updateLastSync(date: Date): Promise<void>;
};

/**
 * Opções para fetchPageWithRetry().
 *
 * @property label         — Nome do módulo (ex: "product-structure") para logging
 * @property externalRequestId — ID de idempotência do comando
 * @property page          — Número da página atual
 * @property pageSize      — Tamanho da página
 * @property maxAttempts   — Máximo de tentativas para erros comuns (default: 3)
 * @property maxRedundantWaits — Máximo de waits por consumo redundante (default: 5, 0 = desliga)
 */
export type RetryOptions = {
    label: string;
    externalRequestId: string;
    page: number;
    pageSize: number;
    maxAttempts?: number;
    maxRedundantWaits?: number;
};

/**
 * Metadados de progresso da paginação.
 */
export type PaginationMeta = {
    totalPages: number | null;
    currentPage: number;
};
