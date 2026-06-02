// apps/api/src/modules/integration/product-structure/application/ports/product-structure-fetch.gateway.ts

export type ProductStructureItem = {
  componentCode: string;
  quantity: string;
  unit?: string;
};

export type ProductStructureFetchResult = {
  productCode: string;
  hasStructure: boolean;
  items: ProductStructureItem[];
  rawPayload?: unknown;
};

export interface ProductStructureFetchGateway {
  fetchByProductCode(productCode: string): Promise<ProductStructureFetchResult>;
}