// apps/api/src/modules/integration/product-structure/application/ports/product-structure-fetch.gateway.ts

export type ProductStructureItem = {
  componentCode: string;
  description: string | null;
  familyCode: string | null;
  familyDescription: string | null;
  quantity: string;
  unit: string | null;
  loss: string | null;
  omieMeshId: string | null;
  productType: string | null;
};

export type ProductStructureFetchResult = {
  productCode: string;
  description: string | null;
  familyCode: string | null;
  familyDescription: string | null;
  productType: string | null;
  unit: string | null;
  grossWeight: number | null;
  netWeight: number | null;
  omieProductId: string | null;
  omieProductIntegrationId: string | null;
  hasStructure: boolean;
  items: ProductStructureItem[];
  rawPayload?: unknown;
};

export interface ProductStructureFetchGateway {
  fetchByProductCode(productCode: string): Promise<ProductStructureFetchResult>;
}