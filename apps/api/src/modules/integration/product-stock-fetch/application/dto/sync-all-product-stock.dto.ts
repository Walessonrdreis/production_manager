// ---------------------------------------------------------------------------
// DTO: SyncAllProductStock
// ---------------------------------------------------------------------------

export type SyncAllProductStockRequestDTO = {
  externalRequestId?: string;
  pageSize?: number;
  maxPages?: number;
};

export type SyncAllProductStockResponseDTO = {
  status: "ACCEPTED";
  externalRequestId: string;
  resourceId: "__GLOBAL__";
};
