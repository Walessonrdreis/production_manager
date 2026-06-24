export type SalesOrderFetchPageInput = {
  page: number;
  pageSize: number;
  updatedSince?: Date;
};

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
  updatedAt: Date | null;
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

  // ✅ progresso real
  totalPages: number | null;
  currentPage: number;
};

export type SalesOrderFetchPageGateway = {
  fetchPage(input: SalesOrderFetchPageInput): Promise<SalesOrderFetchPageResult>;
};