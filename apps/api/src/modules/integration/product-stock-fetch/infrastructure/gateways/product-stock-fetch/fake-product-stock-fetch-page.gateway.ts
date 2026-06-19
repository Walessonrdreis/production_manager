// ---------------------------------------------------------------------------
// Fake Gateway: FakeProductStockFetchPageGateway
// Retorna dados simulados de posição de estoque para testes.
// ---------------------------------------------------------------------------

import type {
  ProductStockFetchPageGateway,
  ProductStockFetchPageInput,
  ProductStockFetchPageResult,
} from "../../../application/ports/product-stock-fetch-page.gateway";

export class FakeProductStockFetchPageGateway implements ProductStockFetchPageGateway {
  async fetchPage({ page, pageSize }: ProductStockFetchPageInput): Promise<ProductStockFetchPageResult> {
    if (page > 1) {
      return {
        items: [],
        hasNext: false,
        totalPages: 1,
        currentPage: page,
      };
    }

    const items = Array.from({ length: Math.min(pageSize, 5) }).map((_, index) => ({
      productId: `FAKE-PROD-${100 + index}`,
      stockQuantity: Math.floor(Math.random() * 100),
      minimumStock: 10,
      breakdown: [
        {
          stockLocationCode: 1,
          quantity: Math.floor(Math.random() * 100),
        },
      ],
    }));

    return {
      items,
      hasNext: false,
      totalPages: 1,
      currentPage: page,
    };
  }
}
