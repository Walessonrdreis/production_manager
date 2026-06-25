export type SyncProductCatalogRequestDTO = {
  externalRequestId: string;
  productCode: string;
};

export type SyncProductCatalogResponseDTO = {
  status: "ACCEPTED";
  externalRequestId: string;
  productCode: string;
};