import { Snapshot } from '../entities/snapshot.entity';

export class SnapshotDTO {
  static toDomain(data: any): Snapshot {
    return {
      id: data.id,
      snapshotId: data.snapshotId,
      description: data.description,
      createdAt: new Date(data.createdAt),
    };
  }

  static fromDomain(snapshot: Snapshot): {
    id: string;
    snapshotId: string;
    description?: string;
    createdAt: string;
  } {
    return {
      id: snapshot.id,
      snapshotId: snapshot.snapshotId,
      description: snapshot.description,
      createdAt: snapshot.createdAt.toISOString(),
    };
  }
}