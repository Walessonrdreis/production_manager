import { History } from '../entities/history.entity';
import { ProductionControlHistoryAction } from '../entities/production-control-history-action.enum';

export interface HistoryRepository {
  createHistory(history: History): Promise<History>;
  findHistoryById(id: string): Promise<History | null>;
  listHistoryByOrder(orderId: string): Promise<History[]>;
  listHistoryByProduct(productId: string): Promise<History[]>;
  listHistoryBySnapshot(snapshotId: string): Promise<History[]>;
  listHistoryByAction(action: ProductionControlHistoryAction): Promise<History[]>;
  listRecentHistory(limit?: number): Promise<History[]>;
  deleteHistory(id: string): Promise<void>;
  countHistoryByProduct(productId: string): Promise<number>;
  countHistoryByOrder(orderId: string): Promise<number>;
}