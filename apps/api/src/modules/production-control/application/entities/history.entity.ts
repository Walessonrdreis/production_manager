import { ProductionControlHistoryAction } from '@prisma/client';

export interface History {
  id: string;
  orderId?: string;
  productId?: string;
  action: ProductionControlHistoryAction;
  details?: Record<string, any>;
  createdAt: Date;
}

export function createHistory(params: {
  orderId?: string;
  productId?: string;
  action: ProductionControlHistoryAction;
  details?: Record<string, any>;
}): History {
  return {
    id: crypto.randomUUID(),
    orderId: params.orderId,
    productId: params.productId,
    action: params.action,
    details: params.details,
    createdAt: new Date(),
  };
}