import { SnapshotRepository } from '../ports/snapshot.repository.port';
import { Snapshot } from '../entities/snapshot.entity';

export interface ListSnapshotsParams {
  limit?: number;
  offset?: number;
}

export class ListSnapshotsUseCase {
  constructor(private readonly repository: SnapshotRepository) {}

  async execute(params: ListSnapshotsParams = {}): Promise<{
    snapshots: Snapshot[];
    total: number;
    limit: number;
    offset: number;
  }> {
    const { limit = 50, offset = 0 } = params;

    const snapshots = await this.repository.listSnapshots(limit, offset);

    // For simplicity, we're returning the count based on fetched results
    // In a real implementation, you might want a separate count method
    const total = snapshots.length;

    return {
      snapshots,
      total,
      limit,
      offset,
    };
  }
}