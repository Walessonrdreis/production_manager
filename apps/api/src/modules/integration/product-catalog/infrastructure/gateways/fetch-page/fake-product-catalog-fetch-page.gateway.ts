import type {
  ProductCatalogFetchPageGateway,
  ProductCatalogFetchPageInput,
  ProductCatalogFetchPageResult,
} from "../../../application/ports/product-catalog-fetch-page.gateway";

export class FakeProductCatalogFetchPageGateway implements ProductCatalogFetchPageGateway {
  async fetchPage(input: ProductCatalogFetchPageInput): Promise<ProductCatalogFetchPageResult> {
    const { page, pageSize } = input;

    if (page > 1) {
      return {
        items: [],
        hasNextPage: false,
        totalPages: 1,
        currentPage: page,
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
      totalPages: 1,
      currentPage: page,
    };
  }
}