export type SyncProductCatalogRequestDTO = {
  externalRequestId: string;
};

export type SyncProductCatalogResponseDTO = {
  status: "ACCEPTED";
  externalRequestId: string;
  productCode: string;
};