export type SyncAllProductCatalogRequestDTO = {
  externalRequestId?: string;
  pageSize?: number;
  maxPages?: number;
};

export type SyncAllProductCatalogResponseDTO = {
  status: "ACCEPTED";
  externalRequestId: string;
  resourceId: "__GLOBAL__";
};