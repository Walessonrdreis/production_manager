import { ProductCatalogIntegrationStore } from "../../infrastructure/db/product-catalog-integration.store";

export type GetProductCatalogQuery = {
  view?: "summary" | "data";
  q?: string | null;
  activeOnly?: boolean;
  productCodes?: string[] | null;
  sku?: string | null;
  limit?: number;
  offset?: number;
  sort?: "description" | "productCode" | "lastSyncAt";
  order?: "asc" | "desc";
  since?: string | null;
  fields?: string[] | null;
  includeRaw?: boolean;
};

export class GetProductCatalogReadModelUseCase {
  constructor(private readonly store: ProductCatalogIntegrationStore) {}

  async execute(params: GetProductCatalogQuery = {}) {
    const result = await this.store.list(params);

    if (params.view === "summary") {
      return { summary: result.summary };
    }

    if (params.view === "data") {
      return { data: result.data };
    }

    return result;
  }

  async executeByProductCode(
    productCode: string,
    options?: { includeRaw?: boolean }
  ) {
    return this.store.findByProductCode(productCode, options);
  }
}