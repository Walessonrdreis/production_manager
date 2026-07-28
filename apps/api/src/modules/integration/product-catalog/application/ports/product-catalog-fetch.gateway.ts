export type ProductCatalogExternalProduct = {
  productCode: string;
  omieId: string | null;
  sku: string | null;
  description: string;
  familyDescription: string | null;
  active: boolean;
  rawPayload: any;
};

export interface ProductCatalogFetchGateway {
  fetchByProductCode(productCode: string): Promise<ProductCatalogExternalProduct | null>;
}