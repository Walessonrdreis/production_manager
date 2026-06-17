export type SalesOrderFetchPageItem = {
  omieId: string;
  orderNumber: string | null;
  stage: string;
  isCanceled: boolean;
  isClosed: boolean;
  customerOmieId: string | null;
  companyOmieId: string | null;
  forecastDate: Date | null;
  totalAmount: number | null;
  rawPayload: unknown;

  items: Array<{
    omieItemId: string;
    productCode: string;
    productOmieId: string;
    description: string;
    unit: string | null;
    quantity: number;
    unitPrice: number | null;
    totalPrice: number | null;
    rawPayload: unknown;
  }>;
};

export type SalesOrderFetchPageResult = {
  items: SalesOrderFetchPageItem[];
  hasNextPage: boolean;

  // ✅ PROGRESSO REAL (igual product-catalog)
  totalPages: number | null;

  // ✅ opcional (ajuda no debug/log)
  currentPage: number;
};

export interface SalesOrderFetchPageGateway {
  fetchPage(
    page: number,
    pageSize: number
  ): Promise<SalesOrderFetchPageResult>;
}