import { PrismaClient } from "@prisma/client";
import { SyncRepositoryPort, SyncRecord } from "../../application/ports/sync.repository.port";
import { SyncStatusRequest } from "../../application/dtos/sync-status.dto";

export class SyncRepositoryPrisma implements SyncRepositoryPort {
  constructor(private readonly prisma: PrismaClient) {}

  async createSyncRecord(syncRecord: Omit<SyncRecord, "id">): Promise<SyncRecord> {
    const record = await this.prisma.syncRecord.create({
      data: {
        syncType: syncRecord.syncType,
        status: syncRecord.status,
        startedAt: syncRecord.startedAt,
        completedAt: syncRecord.completedAt,
        durationMs: syncRecord.durationMs,
        itemsProcessed: syncRecord.itemsProcessed,
        itemsFailed: syncRecord.itemsFailed,
        error: syncRecord.error,
        metadata: syncRecord.metadata,
      },
    });

    return this.mapToDomain(record);
  }

  async updateSyncRecord(id: string, updates: Partial<SyncRecord>): Promise<SyncRecord> {
    const record = await this.prisma.syncRecord.update({
      where: { id },
      data: {
        status: updates.status,
        completedAt: updates.completedAt,
        durationMs: updates.durationMs,
        itemsProcessed: updates.itemsProcessed,
        itemsFailed: updates.itemsFailed,
        error: updates.error,
        metadata: updates.metadata,
      },
    });

    return this.mapToDomain(record);
  }

  async getSyncRecordById(id: string): Promise<SyncRecord | null> {
    const record = await this.prisma.syncRecord.findUnique({
      where: { id },
    });

    return record ? this.mapToDomain(record) : null;
  }

  async getRecentSyncs(params: SyncStatusRequest): Promise<SyncRecord[]> {
    const where: any = {};

    if (params.syncType !== "all") {
      where.syncType = params.syncType;
    }

    if (params.dateFrom) {
      where.startedAt = {
        gte: new Date(params.dateFrom),
      };
    }

    if (params.dateTo) {
      where.startedAt = {
        ...where.startedAt,
        lte: new Date(params.dateTo),
      };
    }

    const records = await this.prisma.syncRecord.findMany({
      where,
      orderBy: { startedAt: "desc" },
      take: params.limit,
    });

    return records.map(record => this.mapToDomain(record));
  }

  async getSyncStatsByType(dateFrom?: Date, dateTo?: Date): Promise<Record<string, any>> {
    const where: any = {};

    if (dateFrom) {
      where.startedAt = {
        gte: dateFrom,
      };
    }

    if (dateTo) {
      where.startedAt = {
        ...where.startedAt,
        lte: dateTo,
      };
    }

    const stats = await this.prisma.syncRecord.groupBy({
      by: ["syncType", "status"],
      where,
      _count: {
        id: true,
      },
      _avg: {
        durationMs: true,
      },
    });

    const result: Record<string, any> = {};

    for (const stat of stats) {
      const type = stat.syncType;
      const status = stat.status;

      result[`${type}_total`] = (result[`${type}_total`] || 0) + stat._count.id;
      
      if (status === "success") {
        result[`${type}_success`] = stat._count.id;
        result[`${type}_avg_duration`] = stat._avg.durationMs || 0;
      } else if (status === "failed") {
        result[`${type}_failed`] = stat._count.id;
      }
    }

    return result;
  }

  async getLastSuccessfulSync(syncType: SyncRecord["syncType"]): Promise<SyncRecord | null> {
    const record = await this.prisma.syncRecord.findFirst({
      where: {
        syncType,
        status: "success",
      },
      orderBy: { completedAt: "desc" },
    });

    return record ? this.mapToDomain(record) : null;
  }

  async getSyncSummary(params: SyncStatusRequest): Promise<{
    totalSyncs: number;
    successfulSyncs: number;
    failedSyncs: number;
    averageDurationMs: number;
    lastSyncAt?: Date;
  }> {
    const where: any = {};

    if (params.syncType !== "all") {
      where.syncType = params.syncType;
    }

    if (params.dateFrom) {
      where.startedAt = {
        gte: new Date(params.dateFrom),
      };
    }

    if (params.dateTo) {
      where.startedAt = {
        ...where.startedAt,
        lte: new Date(params.dateTo),
      };
    }

    const [total, successful, failed, avgDuration, lastSync] = await Promise.all([
      this.prisma.syncRecord.count({ where }),
      this.prisma.syncRecord.count({
        where: { ...where, status: "success" },
      }),
      this.prisma.syncRecord.count({
        where: { ...where, status: "failed" },
      }),
      this.prisma.syncRecord.aggregate({
        where: { ...where, status: "success" },
        _avg: { durationMs: true },
      }),
      this.prisma.syncRecord.findFirst({
        where: { ...where, status: "success" },
        orderBy: { completedAt: "desc" },
        select: { completedAt: true },
      }),
    ]);

    return {
      totalSyncs: total,
      successfulSyncs: successful,
      failedSyncs: failed,
      averageDurationMs: avgDuration._avg.durationMs || 0,
      lastSyncAt: lastSync?.completedAt || undefined,
    };
  }

  private mapToDomain(record: any): SyncRecord {
    return {
      id: record.id,
      syncType: record.syncType as "stock" | "orders" | "production",
      status: record.status as "success" | "failed" | "in_progress",
      startedAt: record.startedAt,
      completedAt: record.completedAt,
      durationMs: record.durationMs,
      itemsProcessed: record.itemsProcessed,
      itemsFailed: record.itemsFailed,
      error: record.error,
      metadata: record.metadata,
    };
  }
}

export function createSyncRepository(prisma: PrismaClient): SyncRepositoryPort {
  return new SyncRepositoryPrisma(prisma);
}