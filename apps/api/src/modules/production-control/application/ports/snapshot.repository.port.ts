import { Snapshot } from '../entities/snapshot.entity';

export interface SnapshotRepository {
  createSnapshot(snapshot: Snapshot): Promise<Snapshot>;
  findSnapshotById(id: string): Promise<Snapshot | null>;
  findSnapshotBySnapshotId(snapshotId: string): Promise<Snapshot | null>;
  findLatestSnapshot(): Promise<Snapshot | null>;
  listSnapshots(limit?: number): Promise<Snapshot[]>;
  deleteSnapshot(id: string): Promise<void>;
  countSnapshots(): Promise<number>;
}