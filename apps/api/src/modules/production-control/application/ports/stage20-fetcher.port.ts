export interface Stage20OrderDetail {
  orderId: string;
  orderNumber: string | null;
  clientCode: string | null;
  clientName: string | null;
  quantity: number;
  productCode: string | null;
}

export interface Stage20Product {
  description: string;
  totalQuantity: number;
  orders: Stage20OrderDetail[];
}

export interface Stage20Fetcher {
  fetchStage20Products(): Promise<Stage20Product[]>;
}