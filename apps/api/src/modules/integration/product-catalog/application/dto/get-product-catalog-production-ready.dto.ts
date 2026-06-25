export type GetProductCatalogProductionReadyQueryDTO = {
  q?: string | null;
  onlyActive?: boolean;
  onlyInStock?: boolean;
  minStock?: number;
  limit?: number;
  offset?: number;
  sort?: "description" | "productCode" | "stock" | "lastSyncAt";
  order?: "asc" | "desc";
  withAvailability?: boolean;
  onlyWithOpenOrders?: boolean;
};

export type ProductCatalogProductionReadyStatus =
  | "READY"
  | "READY_WITH_DEMAND"
  | "NO_STOCK"
  | "NO_STOCK_WITH_DEMAND"
  | "NO_STRUCTURE"
  | "INACTIVE";

export type ProductCatalogProductionReadyItemDTO = {
  productCode: string;
  omieCode: string | null;
  description: string;
  sku: string | null;
  active: boolean;
  family: string | null;
  unit: string | null;
  lastSyncAt: Date | null;

  salePrice: number | null;
  cost: number | null;
  margin: number | null;

  stock: number;
  minimumStock: number;
  available: boolean;
  belowMinimumStock: boolean;

  hasStructure: boolean;
  structureItemsCount: number;
  structureItemsBelowMinStock: number;

  hasOpenProductionOrder: boolean;
  openProductionOrderCount: number;

  hasOpenSalesOrderStage20: boolean;
  openSalesOrderStage20Count: number;

  status: ProductCatalogProductionReadyStatus;
};

export type GetProductCatalogProductionReadyResponseDTO = {
  summary: {
    total: number;
    available: number;
    unavailable: number;
  };
  meta: {
    pageSize: number;
    pageCount: number;
    offset: number;
  };
  isDataFullyReady: boolean;
  data: ProductCatalogProductionReadyItemDTO[];
};