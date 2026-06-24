// ---------------------------------------------------------------------------
// DTO — Create Production Order
// ---------------------------------------------------------------------------
// Dados para criação de uma ordem de produção no Omie via PgBoss worker.
// ---------------------------------------------------------------------------

export type ProcessCreateProductionOrderData = {
    externalRequestId: string;
    productId: string;
    quantity: number;
    scheduledDate?: string;
    notes?: string;
};
