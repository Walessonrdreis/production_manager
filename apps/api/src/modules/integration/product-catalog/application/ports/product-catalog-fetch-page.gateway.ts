export type ProductCatalogExternalProduct = {
  productCode: string;
  omieId: string | null;
  sku: string | null;
  description: string;
  familyDescription: string | null;
  active: boolean;
  rawPayload: any;
};

export type ProductCatalogFetchPageInput = {
  page: number;
  pageSize: number;
  updatedSince?: Date;
};

export type ProductCatalogFetchPageResult = {
  items: ProductCatalogExternalProduct[];
  hasNextPage: boolean;
  totalPages: number | null;
  currentPage: number;
};

export interface ProductCatalogFetchPageGateway {
  fetchPage(input: ProductCatalogFetchPageInput): Promise<ProductCatalogFetchPageResult>;
}