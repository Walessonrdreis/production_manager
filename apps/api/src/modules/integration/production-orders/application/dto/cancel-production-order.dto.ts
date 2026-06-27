// ---------------------------------------------------------------------------
// DTO — Cancel Production Order
// ---------------------------------------------------------------------------
// Dados para cancelamento de uma ordem de produção no Omie via PgBoss worker.
// ---------------------------------------------------------------------------

export type ProcessCancelProductionOrderData = {
    externalRequestId: string;
    omieId: string;
    reason?: string;
};
