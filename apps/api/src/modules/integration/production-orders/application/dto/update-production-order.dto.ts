// ---------------------------------------------------------------------------
// DTO — Update Production Order
// ---------------------------------------------------------------------------
// Dados para atualização de uma ordem de produção no Omie via PgBoss worker.
// ---------------------------------------------------------------------------

export type ProcessUpdateProductionOrderData = {
    externalRequestId: string;
    omieId: string;
    quantity?: number;
    forecastDate?: string;
    notes?: string;
};
