import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetSyncStatusUseCase } from "../../../../src/modules/sync/application/use-cases/get-sync-status.usecase";
import type { SyncRepositoryPort } from "../../../../src/modules/sync/application/ports/sync.repository.port";
import type { Logger } from "fastify";

describe("GetSyncStatusUseCase", () => {
  let syncRepository: SyncRepositoryPort;
  let logger: Logger;
  let useCase: GetSyncStatusUseCase;

  beforeEach(() => {
    syncRepository = {
      createSyncRecord: vi.fn(),
      updateSyncRecord: vi.fn(),
      getSyncRecordById: vi.fn(),
      getRecentSyncs: vi.fn(),
      getSyncStatsByType: vi.fn(),
      getLastSuccessfulSync: vi.fn(),
      getSyncSummary: vi.fn(),
    };

    logger = {
      info: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      fatal: vi.fn(),
      trace: vi.fn(),
      child: vi.fn(),
    } as any;

    useCase = new GetSyncStatusUseCase({
      syncRepository,
      logger,
    });
  });

  describe("execute", () => {
    it("deve obter status de sincronização com sucesso", async () => {
      const mockRecentSyncs = [
        {
          id: "sync-123",
          syncType: "stock" as const,
          status: "success" as const,
          startedAt: new Date("2024-01-10T10:00:00Z"),
          completedAt: new Date("2024-01-10T10:02:00Z"),
          durationMs: 120000,
          itemsProcessed: 100,
          itemsFailed: 0,
          error: undefined,
          metadata: {},
        },
        {
          id: "sync-124",
          syncType: "orders" as const,
          status: "success" as const,
          startedAt: new Date("2024-01-10T10:05:00Z"),
          completedAt: new Date("2024-01-10T10:06:00Z"),
          durationMs: 60000,
          itemsProcessed: 50,
          itemsFailed: 2,
          error: "2 pedidos falharam",
          metadata: {},
        },
      ];

      const mockSyncStats = {
        stock_total: 10,
        stock_success: 8,
        stock_failed: 2,
        stock_avg_duration: 120000,
        orders_total: 15,
        orders_success: 12,
        orders_failed: 3,
        orders_avg_duration: 60000,
        production_total: 5,
        production_success: 4,
        production_failed: 1,
        production_avg_duration: 30000,
      };

      const mockSummary = {
        totalSyncs: 30,
        successfulSyncs: 24,
        failedSyncs: 6,
        averageDurationMs: 70000,
        lastSyncAt: new Date("2024-01-10T10:06:00Z"),
      };

      const mockLastSuccessfulSync = {
        id: "sync-123",
        syncType: "stock" as const,
        status: "success" as const,
        startedAt: new Date("2024-01-10T10:00:00Z"),
        completedAt: new Date("2024-01-10T10:02:00Z"),
        durationMs: 120000,
        itemsProcessed: 100,
        itemsFailed: 0,
        error: undefined,
        metadata: {},
      };

      vi.mocked(syncRepository.getRecentSyncs).mockResolvedValue(mockRecentSyncs);
      vi.mocked(syncRepository.getSyncStatsByType).mockResolvedValue(mockSyncStats);
      vi.mocked(syncRepository.getSyncSummary).mockResolvedValue(mockSummary);
      vi.mocked(syncRepository.getLastSuccessfulSync).mockResolvedValue(mockLastSuccessfulSync);

      const request = {
        syncType: "all",
        limit: 20,
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.message).toBe("Status de sincronização obtido com sucesso");
      expect(result.data.summary.totalSyncs).toBe(30);
      expect(result.data.summary.successfulSyncs).toBe(24);
      expect(result.data.summary.failedSyncs).toBe(6);
      expect(result.data.summary.averageDurationMs).toBe(70000);
      expect(result.data.summary.lastSyncAt).toBe("2024-01-10T10:06:00.000Z");
      expect(result.data.summary.nextSyncAt).toBeDefined();

      expect(result.data.recentSyncs).toHaveLength(2);
      expect(result.data.recentSyncs[0].id).toBe("sync-123");
      expect(result.data.recentSyncs[0].syncType).toBe("stock");
      expect(result.data.recentSyncs[0].status).toBe("success");
      expect(result.data.recentSyncs[0].durationMs).toBe(120000);

      expect(result.data.syncStatsByType.stock.totalSyncs).toBe(10);
      expect(result.data.syncStatsByType.stock.successfulSyncs).toBe(8);
      expect(result.data.syncStatsByType.stock.failedSyncs).toBe(2);
      expect(result.data.syncStatsByType.stock.averageDurationMs).toBe(120000);
      expect(result.data.syncStatsByType.stock.lastSyncAt).toBe("2024-01-10T10:02:00.000Z");

      expect(syncRepository.getRecentSyncs).toHaveBeenCalledWith(request);
      expect(syncRepository.getSyncStatsByType).toHaveBeenCalledWith(undefined, undefined);
      expect(syncRepository.getSyncSummary).toHaveBeenCalledWith(request);
      expect(syncRepository.getLastSuccessfulSync).toHaveBeenCalledWith("stock");
    });

    it("deve filtrar por tipo de sincronização", async () => {
      const mockRecentSyncs = [
        {
          id: "sync-123",
          syncType: "stock" as const,
          status: "success" as const,
          startedAt: new Date(),
          completedAt: new Date(),
          durationMs: 120000,
          itemsProcessed: 100,
          itemsFailed: 0,
          error: undefined,
          metadata: {},
        },
      ];

      vi.mocked(syncRepository.getRecentSyncs).mockResolvedValue(mockRecentSyncs);
      vi.mocked(syncRepository.getSyncStatsByType).mockResolvedValue({});
      vi.mocked(syncRepository.getSyncSummary).mockResolvedValue({
        totalSyncs: 10,
        successfulSyncs: 8,
        failedSyncs: 2,
        averageDurationMs: 120000,
        lastSyncAt: new Date(),
      });
      vi.mocked(syncRepository.getLastSuccessfulSync).mockResolvedValue(null);

      const request = {
        syncType: "stock",
        limit: 10,
      };

      await useCase.execute(request);

      expect(syncRepository.getRecentSyncs).toHaveBeenCalledWith(request);
      expect(syncRepository.getSyncStatsByType).toHaveBeenCalledWith(undefined, undefined);
      expect(syncRepository.getSyncSummary).toHaveBeenCalledWith(request);
    });

    it("deve filtrar por data", async () => {
      const mockRecentSyncs = [
        {
          id: "sync-123",
          syncType: "stock" as const,
          status: "success" as const,
          startedAt: new Date(),
          completedAt: new Date(),
          durationMs: 120000,
          itemsProcessed: 100,
          itemsFailed: 0,
          error: undefined,
          metadata: {},
        },
      ];

      vi.mocked(syncRepository.getRecentSyncs).mockResolvedValue(mockRecentSyncs);
      vi.mocked(syncRepository.getSyncStatsByType).mockResolvedValue({});
      vi.mocked(syncRepository.getSyncSummary).mockResolvedValue({
        totalSyncs: 10,
        successfulSyncs: 8,
        failedSyncs: 2,
        averageDurationMs: 120000,
        lastSyncAt: new Date(),
      });
      vi.mocked(syncRepository.getLastSuccessfulSync).mockResolvedValue(null);

      const dateFrom = new Date("2024-01-01");
      const dateTo = new Date("2024-01-31");

      const request = {
        syncType: "all",
        dateFrom: dateFrom.toISOString(),
        dateTo: dateTo.toISOString(),
        limit: 10,
      };

      await useCase.execute(request);

      expect(syncRepository.getRecentSyncs).toHaveBeenCalledWith(request);
      expect(syncRepository.getSyncStatsByType).toHaveBeenCalledWith(dateFrom, dateTo);
      expect(syncRepository.getSyncSummary).toHaveBeenCalledWith(request);
    });

    it("deve calcular próximo horário de sincronização corretamente", async () => {
      const now = Date.now();
      const twoMinutesAgo = new Date(now - 2 * 60 * 1000);
      const twoMinutesAgoPlus2Min = new Date(now); // Agora (próximo sync)

      const mockRecentSyncs = [
        {
          id: "sync-123",
          syncType: "stock" as const,
          status: "success" as const,
          startedAt: twoMinutesAgo,
          completedAt: twoMinutesAgo,
          durationMs: 120000,
          itemsProcessed: 100,
          itemsFailed: 0,
          error: undefined,
          metadata: {},
        },
      ];

      const mockSyncStats = {
        stock_total: 1,
        stock_success: 1,
        stock_failed: 0,
        stock_avg_duration: 120000,
        orders_total: 0,
        orders_success: 0,
        orders_failed: 0,
        orders_avg_duration: 0,
        production_total: 0,
        production_success: 0,
        production_failed: 0,
        production_avg_duration: 0,
      };

      const mockSummary = {
        totalSyncs: 1,
        successfulSyncs: 1,
        failedSyncs: 0,
        averageDurationMs: 120000,
        lastSyncAt: twoMinutesAgo,
      };

      vi.mocked(syncRepository.getRecentSyncs).mockResolvedValue(mockRecentSyncs);
      vi.mocked(syncRepository.getSyncStatsByType).mockResolvedValue(mockSyncStats);
      vi.mocked(syncRepository.getSyncSummary).mockResolvedValue(mockSummary);
      vi.mocked(syncRepository.getLastSuccessfulSync).mockResolvedValue(mockRecentSyncs[0]);

      const request = {
        syncType: "all",
        limit: 10,
      };

      const result = await useCase.execute(request);

      // O próximo sync deve ser um timestamp futuro
      const nextSyncTime = new Date(result.data.summary.nextSyncAt!).getTime();
      expect(nextSyncTime).toBeGreaterThan(now);
    });

    it("deve lidar com exceções ao obter status", async () => {
      vi.mocked(syncRepository.getRecentSyncs).mockRejectedValue(new Error("Erro no banco de dados"));

      const request = {
        syncType: "all",
        limit: 10,
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.message).toContain("Erro ao obter status");
      expect(result.data.summary.totalSyncs).toBe(0);
      expect(result.data.recentSyncs).toHaveLength(0);
      expect(result.data.syncStatsByType).toEqual({});

      expect(logger.error).toHaveBeenCalledWith(
        "Erro ao obter status de sincronização",
        expect.objectContaining({
          error: "Erro no banco de dados",
        })
      );
    });

    it("deve retornar próximo sync padrão quando não há sincronizações recentes", async () => {
      vi.mocked(syncRepository.getRecentSyncs).mockResolvedValue([]);
      vi.mocked(syncRepository.getSyncStatsByType).mockResolvedValue({});
      vi.mocked(syncRepository.getSyncSummary).mockResolvedValue({
        totalSyncs: 0,
        successfulSyncs: 0,
        failedSyncs: 0,
        averageDurationMs: 0,
        lastSyncAt: undefined,
      });
      vi.mocked(syncRepository.getLastSuccessfulSync).mockResolvedValue(null);

      const request = {
        syncType: "all",
        limit: 10,
      };

      const result = await useCase.execute(request);

      expect(result.data.summary.nextSyncAt).toBeDefined();
      // Deve ser um timestamp futuro
      const nextSyncTime = new Date(result.data.summary.nextSyncAt!).getTime();
      expect(nextSyncTime).toBeGreaterThan(Date.now());
    });
  });
});