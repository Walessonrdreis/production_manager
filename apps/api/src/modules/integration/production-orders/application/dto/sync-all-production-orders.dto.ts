// ---------------------------------------------------------------------------
// DTOs — Sync All Production Orders
// ---------------------------------------------------------------------------
// Segue o mesmo padrão de SyncAllProductStructureDTO.
// ---------------------------------------------------------------------------

export type SyncAllProductionOrdersRequestDTO = {
    externalRequestId?: string;
    pageSize?: number;
    maxPages?: number;
};

export type SyncAllProductionOrdersResponseDTO = {
    status: "ACCEPTED";
    externalRequestId: string;
    resourceId: "__GLOBAL__";
};
