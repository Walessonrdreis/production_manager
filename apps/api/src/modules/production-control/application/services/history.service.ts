import { HistoryRepository } from '../ports/history.repository.port';
import { History, createHistory } from '../entities/history.entity';
import { ProductionControlHistoryAction } from '../entities/production-control-history-action.enum';

export class HistoryService {
  constructor(private readonly repository: HistoryRepository) {}

  async recordSnapshotCreated(snapshotId: string): Promise<History> {
    const history = createHistory({
      action: 'SNAPSHOT_CREATED',
      details: { snapshotId },
    });

    return await this.repository.createHistory(history);
  }

  async recordOrderCheck(
    orderId: string,
    checked: boolean,
    productId?: string
  ): Promise<History> {
    const action: ProductionControlHistoryAction = checked
      ? 'ORDER_CHECKED'
      : 'ORDER_UNCHECKED';

    const history = createHistory({
      orderId,
      productId,
      action,
      details: { orderId, checked },
    });

    return await this.repository.createHistory(history);
  }

  async recordProductCheck(
    productId: string,
    checked: boolean
  ): Promise<History> {
    const action: ProductionControlHistoryAction = checked
      ? 'PRODUCT_CHECKED'
      : 'PRODUCT_UNCHECKED';

    const history = createHistory({
      productId,
      action,
      details: { productId, checked },
    });

    return await this.repository.createHistory(history);
  }

  async recordDateUpdate(
    productId: string,
    field: 'scheduledDate' | 'actualDate',
    oldValue?: Date,
    newValue?: Date
  ): Promise<History> {
    const history = createHistory({
      productId,
      action: 'DATE_UPDATED',
      details: { productId, field, oldValue, newValue },
    });

    return await this.repository.createHistory(history);
  }

  async recordAutoCompletion(productId: string): Promise<History> {
    const history = createHistory({
      productId,
      action: 'AUTO_COMPLETED',
      details: { productId, completedAt: new Date() },
    });

    return await this.repository.createHistory(history);
  }

  async getProductHistory(productId: string): Promise<History[]> {
    return await this.repository.listHistoryByProduct(productId);
  }

  async getOrderHistory(orderId: string): Promise<History[]> {
    return await this.repository.listHistoryByOrder(orderId);
  }

  async getSnapshotHistory(snapshotId: string): Promise<History[]> {
    return await this.repository.listHistoryBySnapshot(snapshotId);
  }
}