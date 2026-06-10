export type ProductCatalogView = "summary" | "data";

export type GetProductCatalogQueryDTO = {
  view?: ProductCatalogView;
  q?: string | null;
  activeOnly?: boolean;
  limit?: number;
  offset?: number;
  sort?: "description" | "productCode" | "lastSyncAt";
  order?: "asc" | "desc";
  since?: string | null;
};

export type ProductCatalogItemDTO = {
  productCode: string;
  omieId: string | null;
  sku: string | null;
  description: string;
  familyDescription: string | null;
  active: boolean;
  lastSyncAt: Date;
};

export type ProductCatalogSummaryDTO = {
  total: number;
  active: number;
  inactive: number;
};

export type GetProductCatalogResponseDTO = {
  summary?: ProductCatalogSummaryDTO;
  data?: ProductCatalogItemDTO[];
};