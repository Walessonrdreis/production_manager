// ---------------------------------------------------------------------------
// DTO — Change Stage Production Order
// ---------------------------------------------------------------------------
// Dados para alteração de etapa de uma ordem de produção no Omie via PgBoss worker.
// ---------------------------------------------------------------------------

export type ProcessChangeStageProductionOrderData = {
    externalRequestId: string;
    omieId: string;
    stage: string;
};
