import { SyncRepositoryPort } from "../ports/sync.repository.port";
import { SyncStatusRequest, SyncStatusResponse } from "../dtos/sync-status.dto";
import type { Logger } from "@/shared/logger";

export interface GetSyncStatusUseCaseDependencies {
  syncRepository: SyncRepositoryPort;
  logger: Logger;
}

export class GetSyncStatusUseCase {
  constructor(private readonly dependencies: GetSyncStatusUseCaseDependencies) {}

  async execute(request: SyncStatusRequest): Promise<SyncStatusResponse> {
    const { syncRepository, logger } = this.dependencies;

    logger.info("Obtendo status de sincronização", { request });

    try {
      const [recentSyncs, syncStats, summary] = await Promise.all([
        syncRepository.getRecentSyncs(request),
        syncRepository.getSyncStatsByType(
          request.dateFrom ? new Date(request.dateFrom) : undefined,
          request.dateTo ? new Date(request.dateTo) : undefined
        ),
        syncRepository.getSyncSummary(request),
      ]);

      const syncStatsByType: Record<string, any> = {};
      const syncTypes = ["stock", "orders", "production"] as const;

      for (const syncType of syncTypes) {
        const lastSync = await syncRepository.getLastSuccessfulSync(syncType);
        syncStatsByType[syncType] = {
          totalSyncs: syncStats[`${syncType}_total`] || 0,
          successfulSyncs: syncStats[`${syncType}_success`] || 0,
          failedSyncs: syncStats[`${syncType}_failed`] || 0,
          averageDurationMs: syncStats[`${syncType}_avg_duration`] || 0,
          lastSyncAt: lastSync?.completedAt?.toISOString(),
        };
      }

      const response: SyncStatusResponse = {
        success: true,
        message: "Status de sincronização obtido com sucesso",
        data: {
          summary: {
            totalSyncs: summary.totalSyncs,
            successfulSyncs: summary.successfulSyncs,
            failedSyncs: summary.failedSyncs,
            averageDurationMs: summary.averageDurationMs,
            lastSyncAt: summary.lastSyncAt?.toISOString(),
            nextSyncAt: this.calculateNextSyncTime(syncStatsByType),
          },
          recentSyncs: recentSyncs.map(sync => ({
            id: sync.id,
            syncType: sync.syncType,
            status: sync.status,
            startedAt: sync.startedAt.toISOString(),
            completedAt: sync.completedAt?.toISOString(),
            durationMs: sync.durationMs,
            itemsProcessed: sync.itemsProcessed,
            itemsFailed: sync.itemsFailed,
            error: sync.error,
          })),
          syncStatsByType,
        },
        timestamp: new Date().toISOString(),
      };

      if (logger.debug) {
        logger.debug("Status de sincronização obtido", {
          totalSyncs: summary.totalSyncs,
          recentSyncsCount: recentSyncs.length,
        });
      }

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      logger.error("Erro ao obter status de sincronização", {
        error: errorMessage,
      });

      const response: SyncStatusResponse = {
        success: false,
        message: `Erro ao obter status: ${errorMessage}`,
        data: {
          summary: {
            totalSyncs: 0,
            successfulSyncs: 0,
            failedSyncs: 0,
            averageDurationMs: 0,
            lastSyncAt: undefined,
            nextSyncAt: undefined,
          },
          recentSyncs: [],
          syncStatsByType: {},
        },
        timestamp: new Date().toISOString(),
      };

      return response;
    }
  }

  private calculateNextSyncTime(syncStatsByType: Record<string, any>): string | undefined {
    const now = Date.now();
    const intervals = {
      stock: 2 * 60 * 1000, // 2 minutos
      orders: 60 * 1000, // 1 minuto
      production: 30 * 1000, // 30 segundos
    };

    let nextSyncTime: number | undefined;

    for (const [syncType, stats] of Object.entries(syncStatsByType)) {
      if (stats.lastSyncAt) {
        const lastSyncTime = new Date(stats.lastSyncAt).getTime();
        const interval = intervals[syncType as keyof typeof intervals] || 60 * 1000;
        const nextSyncForType = lastSyncTime + interval;

        if (!nextSyncTime || nextSyncForType < nextSyncTime) {
          nextSyncTime = nextSyncForType;
        }
      }
    }

    if (nextSyncTime && nextSyncTime > now) {
      return new Date(nextSyncTime).toISOString();
    }

    // Se não há sincronizações recentes, retorna o próximo intervalo padrão
    return new Date(now + intervals.stock).toISOString();
  }
}

export function createGetSyncStatusUseCase(dependencies: GetSyncStatusUseCaseDependencies): GetSyncStatusUseCase {
  return new GetSyncStatusUseCase(dependencies);
}