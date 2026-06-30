// ---------------------------------------------------------------------------
// DTO — Reconcile Production Orders
// ---------------------------------------------------------------------------
// C3: Comando para reconciliação de OPs (Omie vs read-model).
// ---------------------------------------------------------------------------

export type ReconcileRequestDTO = {
    externalRequestId?: string;
    omieId?: string;
};

export type ReconcileResponseDTO = {
    status: string;
    externalRequestId: string;
    resourceId: string;
};
