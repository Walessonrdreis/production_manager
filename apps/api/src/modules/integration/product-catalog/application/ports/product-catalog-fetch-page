export type ProductCatalogExternalProduct = {
  productCode: string;
  omieId: string | null;
  sku: string | null;
  description: string;
  familyDescription: string | null;
  active: boolean;
  rawPayload: any;
};

export type ProductCatalogFetchPageResult = {
  items: ProductCatalogExternalProduct[];
  hasNextPage: boolean;
};

export interface ProductCatalogFetchPageGateway {
  fetchPage(page: number, pageSize: number): Promise<ProductCatalogFetchPageResult>;
}