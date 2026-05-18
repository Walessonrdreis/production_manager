export interface Snapshot {
  id: string;
  snapshotId: string;
  description?: string;
  createdAt: Date;
}

export function createSnapshot(params: {
  snapshotId: string;
  description?: string;
}): Snapshot {
  return {
    id: crypto.randomUUID(),
    snapshotId: params.snapshotId,
    description: params.description,
    createdAt: new Date(),
  };
}