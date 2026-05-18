import { PrismaClient } from "@prisma/client";
import { SnapshotRepository } from "@/modules/production-control/application/ports/snapshot.repository.port";
import { Snapshot } from "@/modules/production-control/application/entities/snapshot.entity";
import { SnapshotDTO } from "@/modules/production-control/application/dtos/snapshot.dto";

export class SnapshotRepositoryPrisma implements SnapshotRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async createSnapshot(snapshot: Snapshot): Promise<Snapshot> {
    const created = await this.prisma.productionControlSnapshot.create({
      data: {
        snapshotId: snapshot.snapshotId,
        description: snapshot.description,
      },
    });

    return SnapshotDTO.fromPrisma(created);
  }

  async findSnapshotById(id: string): Promise<Snapshot | null> {
    const snapshot = await this.prisma.productionControlSnapshot.findUnique({
      where: { id },
    });

    if (!snapshot) {
      return null;
    }

    return SnapshotDTO.fromPrisma(snapshot);
  }

  async findSnapshotBySnapshotId(snapshotId: string): Promise<Snapshot | null> {
    const snapshot = await this.prisma.productionControlSnapshot.findUnique({
      where: { snapshotId },
    });

    if (!snapshot) {
      return null;
    }

    return SnapshotDTO.fromPrisma(snapshot);
  }

  async listSnapshots(options?: {
    limit?: number;
    offset?: number;
    orderBy?: "createdAt" | "snapshotId";
    orderDirection?: "asc" | "desc";
  }): Promise<Snapshot[]> {
    const {
      limit = 50,
      offset = 0,
      orderBy = "createdAt",
      orderDirection = "desc",
    } = options || {};

    const snapshots = await this.prisma.productionControlSnapshot.findMany({
      take: limit,
      skip: offset,
      orderBy: {
        [orderBy]: orderDirection,
      },
    });

    return snapshots.map(SnapshotDTO.fromPrisma);
  }

  async getLatestSnapshot(): Promise<Snapshot | null> {
    const snapshot = await this.prisma.productionControlSnapshot.findFirst({
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!snapshot) {
      return null;
    }

    return SnapshotDTO.fromPrisma(snapshot);
  }

  async countSnapshots(): Promise<number> {
    return await this.prisma.productionControlSnapshot.count();
  }

  async deleteSnapshot(id: string): Promise<boolean> {
    try {
      await this.prisma.productionControlSnapshot.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async cleanupOldSnapshots(options?: {
    olderThanDays?: number;
    keepLast?: number;
  }): Promise<number> {
    const { olderThanDays = 30, keepLast = 100 } = options || {};

    // Primeiro, obtemos os IDs dos snapshots mais recentes que queremos manter
    const recentSnapshots = await this.prisma.productionControlSnapshot.findMany({
      take: keepLast,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
      },
    });

    const recentSnapshotIds = recentSnapshots.map(s => s.id);

    // Calculamos a data limite
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    // Deletamos snapshots antigos que não estão na lista dos mais recentes
    const result = await this.prisma.productionControlSnapshot.deleteMany({
      where: {
        AND: [
          {
            createdAt: {
              lt: cutoffDate,
            },
          },
          {
            id: {
              notIn: recentSnapshotIds,
            },
          },
        ],
      },
    });

    return result.count;
  }
}