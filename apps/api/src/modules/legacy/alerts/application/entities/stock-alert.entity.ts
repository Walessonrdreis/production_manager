export interface StockAlert {
  id: string;
  productCode: string;
  productDescription: string;
  currentStock: number;
  minimumStock: number;
  severity: "critical" | "warning" | "info";
  status: "active" | "resolved" | "acknowledged";
  createdAt: Date;
  resolvedAt?: Date;
  metadata?: Record<string, any>;
}

export function createStockAlert(params: Omit<StockAlert, "id" | "createdAt">): StockAlert {
  return {
    id: crypto.randomUUID(),
    ...params,
    createdAt: new Date(),
  };
}