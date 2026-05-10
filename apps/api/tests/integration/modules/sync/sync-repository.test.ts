import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSyncRepository } from "../../../../src/modules/sync/infrastructure/db/sync.repository.prisma";

describe("SyncRepository Integration", () => {
  let prisma: PrismaClient;
  let repository: ReturnType<typeof createSyncRepository>;

  beforeEach(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();
    repository = createSyncRepository(prisma);
    
    // Limpar dados de teste
    await prisma.syncRecord.deleteMany({});
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  describe("createSyncRecord", () => {
    it("deve criar um registro de sincronização", async () => {
      const syncRecord = {
        syncType: "stock" as const,
        status: "in_progress" as const,
        startedAt: new Date(),
        itemsProcessed: 0,
        itemsFailed: 0,
        metadata: { test: true },
      };

      const result = await repository.createSyncRecord(syncRecord);

      expect(result.id).toBeDefined();
      expect(result.syncType).toBe("stock");
      expect(result.status).toBe("in_progress");
      expect(result.itemsProcessed).toBe(0);
      expect(result.itemsFailed).toBe(0);
      expect(result.metadata).toEqual({ test: true });
      expect(result.startedAt).toBeInstanceOf(Date);
      expect(result.completedAt).toBeNull();
      expect(result.durationMs).toBeNull();
      expect(result.error).toBeNull();
    });

    it("deve criar registro com dados completos", async () => {
      const syncRecord = {
        syncType: "orders" as const,
        status: "success" as const,
        startedAt: new Date("2024-01-10T10:00:00Z"),
        completedAt: new Date("2024-01-10T10:01:00Z"),
        durationMs: 60000,
        itemsProcessed: 50,
        itemsFailed: 2,
        error: "2 pedidos falharam",
        metadata: { batchSize: 100 },
      };

      const result = await repository.createSyncRecord(syncRecord);

      expect(result.id).toBeDefined();
      expect(result.syncType).toBe("orders");
      expect(result.status).toBe("success");
      expect(result.itemsProcessed).toBe(50);
      expect(result.itemsFailed).toBe(2);
      expect(result.durationMs).toBe(60000);
      expect(result.error).toBe("2 pedidos falharam");
      expect(result.metadata).toEqual({ batchSize: 100 });
      expect(result.completedAt).toBeInstanceOf(Date);
    });
  });

  describe("updateSyncRecord", () => {
    it("deve atualizar um registro de sincronização", async () => {
      // Criar registro inicial
      const initialRecord = await repository.createSyncRecord({
        syncType: "stock" as const,
        status: "in_progress" as const,
        startedAt: new Date(),
        itemsProcessed: 0,
        itemsFailed: 0,
      });

      // Atualizar registro
      const updates = {
        status: "success" as const,
        completedAt: new Date(),
        durationMs: 120000,
        itemsProcessed: 100,
        itemsFailed: 0,
        error: undefined,
        metadata: { forceRefresh: true },
      };

      const result = await repository.updateSyncRecord(initialRecord.id, updates);

      expect(result.id).toBe(initialRecord.id);
      expect(result.status).toBe("success");
      expect(result.completedAt).toBeInstanceOf(Date);
      expect(result.durationMs).toBe(120000);
      expect(result.itemsProcessed).toBe(100);
      expect(result.itemsFailed).toBe(0);
      expect(result.error).toBeNull();
      expect(result.metadata).toEqual({ forceRefresh: true });
    });

    it("deve atualizar apenas campos especificados", async () => {
      const initialRecord = await repository.createSyncRecord({
        syncType: "production" as const,
        status: "in_progress" as const,
        startedAt: new Date(),
        itemsProcessed: 0,
        itemsFailed: 0,
        metadata: { initial: true },
      });

      const updates = {
        status: "failed" as const,
        error: "Erro na produção",
      };

      const result = await repository.updateSyncRecord(initialRecord.id, updates);

      expect(result.id).toBe(initialRecord.id);
      expect(result.status).toBe("failed");
      expect(result.error).toBe("Erro na produção");
      // Campos não atualizados devem permanecer
      expect(result.itemsProcessed).toBe(0);
      expect(result.itemsFailed).toBe(0);
      expect(result.metadata).toEqual({ initial: true });
      expect(result.completedAt).toBeNull();
      expect(result.durationMs).toBeNull();
    });
  });

  describe("getRecentSyncs", () => {
    beforeEach(async () => {
      // Criar dados de teste
      const now = new Date();
      
      await repository.createSyncRecord({
        syncType: "stock" as const,
        status: "success" as const,
        startedAt: new Date(now.getTime() - 10 * 60 * 1000), // 10 minutos atrás
        completedAt: new Date(now.getTime() - 10 * 60 * 1000 + 120000),
        durationMs: 120000,
        itemsProcessed: 100,
        itemsFailed: 0,
      });

      await repository.createSyncRecord({
        syncType: "orders" as const,
        status: "success" as const,
        startedAt: new Date(now.getTime() - 5 * 60 * 1000), // 5 minutos atrás
        completedAt: new Date(now.getTime() - 5 * 60 * 1000 + 60000),
        durationMs: 60000,
        itemsProcessed: 50,
        itemsFailed: 2,
        error: "2 pedidos falharam",
      });

      await repository.createSyncRecord({
        syncType: "stock" as const,
        status: "failed" as const,
        startedAt: new Date(now.getTime() - 2 * 60 * 1000), // 2 minutos atrás
        completedAt: new Date(now.getTime() - 2 * 60 * 1000 + 30000),
        durationMs: 30000,
        itemsProcessed: 0,
        itemsFailed: 0,
        error: "API indisponível",
      });
    });

    it("deve retornar sincronizações recentes", async () => {
      const result = await repository.getRecentSyncs({
        syncType: "all",
        limit: 10,
      });

      expect(result).toHaveLength(3);
      expect(result[0].syncType).toBe("stock");
      expect(result[0].status).toBe("failed"); // Mais recente
      expect(result[1].syncType).toBe("orders");
      expect(result[2].syncType).toBe("stock");
    });

    it("deve filtrar por tipo de sincronização", async () => {
      const result = await repository.getRecentSyncs({
        syncType: "stock",
        limit: 10,
      });

      expect(result).toHaveLength(2);
      expect(result.every(r => r.syncType === "stock")).toBe(true);
    });

    it("deve limitar o número de resultados", async () => {
      const result = await repository.getRecentSyncs({
        syncType: "all",
        limit: 2,
      });

      expect(result).toHaveLength(2);
      // Deve retornar os mais recentes
      expect(result[0].status).toBe("failed");
      expect(result[1].syncType).toBe("orders");
    });

    it("deve filtrar por data", async () => {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      const result = await repository.getRecentSyncs({
        syncType: "all",
        dateFrom: fiveMinutesAgo.toISOString(),
        limit: 10,
      });

      // Deve retornar apenas os registros dos últimos 5 minutos
      // Stock (10 minutos atrás) não deve aparecer
      // Orders (5 minutos atrás) e Stock (2 minutos atrás) devem aparecer
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result.every(r => r.startedAt >= fiveMinutesAgo)).toBe(true);
    });
  });

  describe("getSyncStatsByType", () => {
    beforeEach(async () => {
      // Criar dados de teste
      const now = new Date();
      
      // Stock: 3 sucessos, 1 falha
      await repository.createSyncRecord({
        syncType: "stock" as const,
        status: "success" as const,
        startedAt: new Date(now.getTime() - 60 * 60 * 1000),
        completedAt: new Date(now.getTime() - 60 * 60 * 1000 + 120000),
        durationMs: 120000,
        itemsProcessed: 100,
        itemsFailed: 0,
      });

      await repository.createSyncRecord({
        syncType: "stock" as const,
        status: "success" as const,
        startedAt: new Date(now.getTime() - 30 * 60 * 1000),
        completedAt: new Date(now.getTime() - 30 * 60 * 1000 + 90000),
        durationMs: 90000,
        itemsProcessed: 80,
        itemsFailed: 0,
      });

      await repository.createSyncRecord({
        syncType: "stock" as const,
        status: "success" as const,
        startedAt: new Date(now.getTime() - 15 * 60 * 1000),
        completedAt: new Date(now.getTime() - 15 * 60 * 1000 + 150000),
        durationMs: 150000,
        itemsProcessed: 120,
        itemsFailed: 0,
      });

      await repository.createSyncRecord({
        syncType: "stock" as const,
        status: "failed" as const,
        startedAt: new Date(now.getTime() - 5 * 60 * 1000),
        completedAt: new Date(now.getTime() - 5 * 60 * 1000 + 30000),
        durationMs: 30000,
        itemsProcessed: 0,
        itemsFailed: 0,
        error: "API indisponível",
      });

      // Orders: 2 sucessos, 1 falha
      await repository.createSyncRecord({
        syncType: "orders" as const,
        status: "success" as const,
        startedAt: new Date(now.getTime() - 45 * 60 * 1000),
        completedAt: new Date(now.getTime() - 45 * 60 * 1000 + 60000),
        durationMs: 60000,
        itemsProcessed: 50,
        itemsFailed: 2,
      });

      await repository.createSyncRecord({
        syncType: "orders" as const,
        status: "success" as const,
        startedAt: new Date(now.getTime() - 20 * 60 * 1000),
        completedAt: new Date(now.getTime() - 20 * 60 * 1000 + 45000),
        durationMs: 45000,
        itemsProcessed: 30,
        itemsFailed: 1,
      });

      await repository.createSyncRecord({
        syncType: "orders" as const,
        status: "failed" as const,
        startedAt: new Date(now.getTime() - 10 * 60 * 1000),
        completedAt: new Date(now.getTime() - 10 * 60 * 1000 + 20000),
        durationMs: 20000,
        itemsProcessed: 0,
        itemsFailed: 0,
        error: "Timeout",
      });
    });

    it("deve retornar estatísticas por tipo de sincronização", async () => {
      const result = await repository.getSyncStatsByType();

      expect(result.stock_total).toBe(4);
      expect(result.stock_success).toBe(3);
      expect(result.stock_failed).toBe(1);
      expect(result.stock_avg_duration).toBe(120000); // (120000 + 90000 + 150000) / 3 = 120000

      expect(result.orders_total).toBe(3);
      expect(result.orders_success).toBe(2);
      expect(result.orders_failed).toBe(1);
      expect(result.orders_avg_duration).toBe(52500); // (60000 + 45000) / 2 = 52500
    });

    it("deve filtrar estatísticas por data", async () => {
      const now = new Date();
      const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

      const result = await repository.getSyncStatsByType(thirtyMinutesAgo);

      // Apenas registros dos últimos 30 minutos
      expect(result.stock_total).toBe(2); // 1 sucesso (15 min) + 1 falha (5 min)
      expect(result.stock_success).toBe(1);
      expect(result.stock_failed).toBe(1);

      expect(result.orders_total).toBe(2); // 1 sucesso (20 min) + 1 falha (10 min)
      expect(result.orders_success).toBe(1);
      expect(result.orders_failed).toBe(1);
    });
  });

  describe("getLastSuccessfulSync", () => {
    beforeEach(async () => {
      // Criar dados de teste
      const now = new Date();
      
      // Stock: sucesso mais recente há 30 minutos
      await repository.createSyncRecord({
        syncType: "stock" as const,
        status: "success" as const,
        startedAt: new Date(now.getTime() - 60 * 60 * 1000),
        completedAt: new Date(now.getTime() - 60 * 60 * 1000 + 120000),
        durationMs: 120000,
        itemsProcessed: 100,
        itemsFailed: 0,
      });

      await repository.createSyncRecord({
        syncType: "stock" as const,
        status: "success" as const,
        startedAt: new Date(now.getTime() - 30 * 60 * 1000),
        completedAt: new Date(now.getTime() - 30 * 60 * 1000 + 90000),
        durationMs: 90000,
        itemsProcessed: 80,
        itemsFailed: 0,
      });

      // Stock: falha mais recente
      await repository.createSyncRecord({
        syncType: "stock" as const,
        status: "failed" as const,
        startedAt: new Date(now.getTime() - 5 * 60 * 1000),
        completedAt: new Date(now.getTime() - 5 * 60 * 1000 + 30000),
        durationMs: 30000,
        itemsProcessed: 0,
        itemsFailed: 0,
      });

      // Orders: sucesso mais recente há 20 minutos
      await repository.createSyncRecord({
        syncType: "orders" as const,
        status: "success" as const,
        startedAt: new Date(now.getTime() - 20 * 60 * 1000),
        completedAt: new Date(now.getTime() - 20 * 60 * 1000 + 45000),
        durationMs: 45000,
        itemsProcessed: 30,
        itemsFailed: 1,
      });
    });

    it("deve retornar a última sincronização bem-sucedida por tipo", async () => {
      const stockResult = await repository.getLastSuccessfulSync("stock");
      const ordersResult = await repository.getLastSuccessfulSync("orders");
      const productionResult = await repository.getLastSuccessfulSync("production");

      expect(stockResult).toBeDefined();
      expect(stockResult?.syncType).toBe("stock");
      expect(stockResult?.status).toBe("success");
      expect(stockResult?.itemsProcessed).toBe(80);

      expect(ordersResult).toBeDefined();
      expect(ordersResult?.syncType).toBe("orders");
      expect(ordersResult?.status).toBe("success");
      expect(ordersResult?.itemsProcessed).toBe(30);

      expect(productionResult).toBeNull(); // Não há sincronizações de produção
    });
  });
});