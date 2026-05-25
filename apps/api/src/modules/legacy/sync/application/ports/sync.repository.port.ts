import { SyncStatusRequest, SyncStatusResponse } from "../dtos/sync-status.dto";
import { SyncStockRequest, SyncStockResponse } from "../dtos/sync-stock.dto";
import { SyncOrdersRequest, SyncOrdersResponse } from "../dtos/sync-orders.dto";

export interface SyncRecord {
  id: string;
  syncType: "stock" | "orders" | "production";
  status: "success" | "failed" | "in_progress";
  startedAt: Date;
  completedAt?: Date;
  durationMs?: number;
  itemsProcessed: number;
  itemsFailed: number;
  error?: string;
  metadata?: Record<string, any>;
}

export interface SyncRepositoryPort {
  createSyncRecord(syncRecord: Omit<SyncRecord, "id">): Promise<SyncRecord>;
  updateSyncRecord(id: string, updates: Partial<SyncRecord>): Promise<SyncRecord>;
  getSyncRecordById(id: string): Promise<SyncRecord | null>;
  getRecentSyncs(params: SyncStatusRequest): Promise<SyncRecord[]>;
  getSyncStatsByType(dateFrom?: Date, dateTo?: Date): Promise<Record<string, any>>;
  getLastSuccessfulSync(syncType: SyncRecord["syncType"]): Promise<SyncRecord | null>;
  getSyncSummary(params: SyncStatusRequest): Promise<{
    totalSyncs: number;
    successfulSyncs: number;
    failedSyncs: number;
    averageDurationMs: number;
    lastSyncAt?: Date;
  }>;
}