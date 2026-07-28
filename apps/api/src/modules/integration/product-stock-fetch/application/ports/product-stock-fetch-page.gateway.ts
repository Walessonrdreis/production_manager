// ---------------------------------------------------------------------------
// Port: ProductStockFetchPageGateway
// Define o contrato para consulta paginada de posição de estoque no Omie.
// ---------------------------------------------------------------------------

export type ProductStockFetchPageInput = {
  page: number;
  pageSize: number;
  updatedSince?: Date;
};

export type ProductStockFetchPageItem = {
  productId: string;
  stockQuantity: number;
  minimumStock: number;
  breakdown: Array<{ stockLocationCode: number; quantity: number }>;
};

export type ProductStockFetchPageResult = {
  items: ProductStockFetchPageItem[];
  hasNext: boolean;
  totalPages: number | null;
  currentPage: number;
};

export interface ProductStockFetchPageGateway {
  fetchPage(input: ProductStockFetchPageInput): Promise<ProductStockFetchPageResult>;
}
