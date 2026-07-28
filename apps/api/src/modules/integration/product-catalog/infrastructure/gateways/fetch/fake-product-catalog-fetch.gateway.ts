import type {
  ProductCatalogExternalProduct,
  ProductCatalogFetchGateway,
} from "../../../application/ports/product-catalog-fetch.gateway";

export class FakeProductCatalogFetchGateway implements ProductCatalogFetchGateway {
  async fetchByProductCode(productCode: string): Promise<ProductCatalogExternalProduct | null> {
    return {
      productCode,
      omieId: null,
      sku: null,
      description: `FAKE PRODUCT ${productCode}`,
      familyDescription: null,
      active: true,
      rawPayload: {
        fake: true,
        productCode,
        reason: "Fake gateway ativo (product-catalog)",
      },
    };
  }
}