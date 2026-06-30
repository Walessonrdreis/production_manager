// ---------------------------------------------------------------------------
// DTO — Invalidate Production Order Read-Model
// ---------------------------------------------------------------------------
// C3: Comando para invalidar o read-model de uma OP específica,
// forçando rebuild na próxima consulta.
// ---------------------------------------------------------------------------

export type InvalidateRequestDTO = {
    externalRequestId?: string;
    omieId: string;
};

export type InvalidateResponseDTO = {
    status: string;
    externalRequestId: string;
    omieId: string;
};
