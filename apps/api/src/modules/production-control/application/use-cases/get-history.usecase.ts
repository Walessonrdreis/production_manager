import { SnapshotRepository } from '../ports/snapshot.repository.port';
import { History } from '../entities/history.entity';

export interface GetHistoryParams {
  snapshotId?: string;
  productId?: string;
  orderId?: string;
  limit?: number;
  offset?: number;
}

export class GetHistoryUseCase {
  constructor(private readonly repository: SnapshotRepository) {}

  async execute(params: GetHistoryParams = {}): Promise<{
    history: History[];
    total: number;
    limit: number;
    offset: number;
  }> {
    const { snapshotId, productId, orderId, limit = 50, offset = 0 } = params;

    let history: History[] = [];

    if (orderId) {
      history = await this.repository.findHistoryByOrderId(orderId);
    } else if (productId) {
      history = await this.repository.findHistoryByProductId(productId);
    } else if (snapshotId) {
      history = await this.repository.findHistoryBySnapshotId(snapshotId);
    } else {
      throw new Error('Must provide at least one filter: snapshotId, productId, or orderId');
    }

    // Apply pagination (simplified - in real implementation, pagination should be at DB level)
    const paginatedHistory = history.slice(offset, offset + limit);

    return {
      history: paginatedHistory,
      total: history.length,
      limit,
      offset,
    };
  }
}