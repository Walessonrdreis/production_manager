// ---------------------------------------------------------------------------
// DTOs — Sync Incremental Production Orders
// ---------------------------------------------------------------------------
// C1-P0: Sync incremental (somente registros alterados desde última sync).
// ---------------------------------------------------------------------------

export type SyncIncrementalRequestDTO = {
    externalRequestId?: string;
    pageSize?: number;
    maxPages?: number;
};

export type SyncIncrementalResponseDTO = {
    status: "ACCEPTED";
    externalRequestId: string;
    resourceId: "__INCREMENTAL__";
};
