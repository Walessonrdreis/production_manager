// ---------------------------------------------------------------------------
// DTO — Cancel Production Order
// ---------------------------------------------------------------------------
// Dados para cancelamento de uma ordem de produção no Omie via PgBoss worker.
// ---------------------------------------------------------------------------

export type ProcessCancelProductionOrderData = {
    externalRequestId: string;
    omieCode: string;
    reason?: string;
};
