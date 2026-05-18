import { History } from '../entities/history.entity';
import { ProductionControlHistoryAction } from '../entities/production-control-history-action.enum';

export class HistoryDTO {
  static toDomain(data: any): History {
    return {
      id: data.id,
      orderId: data.orderId,
      productId: data.productId,
      action: data.action as ProductionControlHistoryAction,
      details: data.details,
      createdAt: new Date(data.createdAt),
    };
  }

  static fromDomain(history: History): {
    id: string;
    orderId?: string;
    productId?: string;
    action: string;
    details?: Record<string, any>;
    createdAt: string;
  } {
    return {
      id: history.id,
      orderId: history.orderId,
      productId: history.productId,
      action: history.action,
      details: history.details,
      createdAt: history.createdAt.toISOString(),
    };
  }
}