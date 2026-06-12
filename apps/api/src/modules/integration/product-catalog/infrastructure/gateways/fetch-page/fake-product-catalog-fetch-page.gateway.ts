import type {
  ProductCatalogFetchPageGateway,
  ProductCatalogFetchPageResult,
} from "../../../application/ports/product-catalog-fetch-page.gateway";

export class FakeProductCatalogFetchPageGateway implements ProductCatalogFetchPageGateway {
  async fetchPage(page: number, pageSize: number): Promise<ProductCatalogFetchPageResult> {
    if (page > 1) {
      return {
        items: [],
        hasNextPage: false,
      };
    }

    const items = Array.from({ length: Math.min(pageSize, 5) }).map((_, index) => ({
      productCode: `FAKE-CATALOG-${index + 1}`,
      omieId: null,
      sku: null,
      description: `Fake catalog item ${index + 1}`,
      familyDescription: "Fake family",
      active: true,
      rawPayload: {
        fake: true,
        page,
        index,
      },
    }));

    return {
      items,
      hasNextPage: false,
    };
  }
}