import { describe, it, expect, vi, beforeEach } from "vitest";
import { SyncOrdersUseCase } from "../../../../src/modules/sync/application/use-cases/sync-orders.usecase";
import type { SyncRepositoryPort } from "../../../../src/modules/sync/application/ports/sync.repository.port";
import type { OmieGatewayPort } from "../../../../src/modules/sync/application/ports/omie.gateway.port";
import type { Logger } from "fastify";

describe("SyncOrdersUseCase", () => {
  let syncRepository: SyncRepositoryPort;
  let omieGateway: OmieGatewayPort;
  let logger: Logger;
  let useCase: SyncOrdersUseCase;

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

    omieGateway = {
      getProducts: vi.fn(),
      getProductionOrders: vi.fn(),
      getSalesOrders: vi.fn(),
      updateProductStock: vi.fn(),
      updateOrderStatus: vi.fn(),
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

    useCase = new SyncOrdersUseCase({
      syncRepository,
      omieGateway,
      logger,
    });
  });

  describe("execute", () => {
    it("deve sincronizar pedidos de produção com sucesso", async () => {
      const mockProductionOrders = [
        {
          codigo_pedido: "PRODORD001",
          numero_pedido: "1001",
          codigo_cliente: "CLI001",
          nome_cliente: "Cliente Exemplo 1",
          data_previsao: new Date("2024-01-15"),
          etapa: "corte",
          status: "in_production",
          produtos: [
            {
              codigo_item: "ITEM001",
              codigo_produto: "PROD001",
              descricao: "Produto Exemplo 1",
              quantidade: 10,
              quantidade_produzida: 5,
              unidade: "UN",
              valor_unitario: 100.50,
              valor_total: 1005.00,
            },
          ],
          observacoes: "Pedido prioritário",
        },
      ];

      const mockSyncRecord = {
        id: "sync-123",
        syncType: "orders" as const,
        status: "in_progress" as const,
        startedAt: new Date(),
        itemsProcessed: 0,
        itemsFailed: 0,
      };

      vi.mocked(syncRepository.createSyncRecord).mockResolvedValue(mockSyncRecord);
      vi.mocked(omieGateway.getProductionOrders).mockResolvedValue({
        orders: mockProductionOrders,
        total: 1,
        page: 1,
        limit: 100,
      });

      const request = {
        includeProductionOrders: true,
        includeSalesOrders: false,
        batchSize: 100,
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.data.totalOrders).toBe(1);
      expect(result.data.syncedOrders).toBe(1);
      expect(result.data.productionOrders).toBe(1);
      expect(result.data.salesOrders).toBe(0);
      expect(result.data.failedOrders).toBe(0);
      expect(result.data.durationMs).toBeGreaterThanOrEqual(0);
      expect(result.data.nextSyncAt).toBeDefined();

      expect(syncRepository.createSyncRecord).toHaveBeenCalledWith({
        syncType: "orders",
        status: "in_progress",
        startedAt: expect.any(Date),
        itemsProcessed: 0,
        itemsFailed: 0,
        metadata: { request },
      });

      expect(omieGateway.getProductionOrders).toHaveBeenCalledWith({
        page: 1,
        limit: 100,
        status: undefined,
        dateFrom: undefined,
        dateTo: undefined,
      });

      expect(syncRepository.updateSyncRecord).toHaveBeenCalledWith(
        mockSyncRecord.id,
        expect.objectContaining({
          status: "success",
          completedAt: expect.any(Date),
          durationMs: expect.any(Number),
          itemsProcessed: 1,
          itemsFailed: 0,
        })
      );
    });

    it("deve sincronizar pedidos de venda com sucesso", async () => {
      const mockSalesOrders = [
        {
          cabecalho: {
            codigo_pedido: "SALESORD001",
            numero_pedido: "2001",
            codigo_cliente: "CLI001",
            nome_cliente: "Cliente Exemplo 1",
            data_previsao: new Date("2024-01-10"),
            etapa: "aprovado",
            status: "approved",
            valor_total: 1500.75,
          },
          detalhes: [
            {
              codigo_item: "SALESITEM001",
              codigo_produto: "PROD001",
              descricao: "Produto Exemplo 1",
              quantidade: 15,
              unidade: "UN",
              valor_unitario: 100.50,
              valor_total: 1507.50,
            },
          ],
        },
      ];

      const mockSyncRecord = {
        id: "sync-123",
        syncType: "orders" as const,
        status: "in_progress" as const,
        startedAt: new Date(),
        itemsProcessed: 0,
        itemsFailed: 0,
      };

      vi.mocked(syncRepository.createSyncRecord).mockResolvedValue(mockSyncRecord);
      vi.mocked(omieGateway.getSalesOrders).mockResolvedValue({
        orders: mockSalesOrders,
        total: 1,
        page: 1,
        limit: 100,
      });

      const request = {
        includeProductionOrders: false,
        includeSalesOrders: true,
        batchSize: 100,
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.data.totalOrders).toBe(1);
      expect(result.data.syncedOrders).toBe(1);
      expect(result.data.productionOrders).toBe(0);
      expect(result.data.salesOrders).toBe(1);
      expect(result.data.failedOrders).toBe(0);

      expect(omieGateway.getSalesOrders).toHaveBeenCalledWith({
        page: 1,
        limit: 100,
        status: undefined,
        dateFrom: undefined,
        dateTo: undefined,
      });
    });

    it("deve sincronizar ambos os tipos de pedidos", async () => {
      const mockProductionOrders = [
        {
          codigo_pedido: "PRODORD001",
          numero_pedido: "1001",
          codigo_cliente: "CLI001",
          nome_cliente: "Cliente Exemplo 1",
          data_previsao: new Date("2024-01-15"),
          etapa: "corte",
          status: "in_production",
          produtos: [
            {
              codigo_item: "ITEM001",
              codigo_produto: "PROD001",
              descricao: "Produto Exemplo 1",
              quantidade: 10,
              quantidade_produzida: 5,
              unidade: "UN",
              valor_unitario: 100.50,
              valor_total: 1005.00,
            },
          ],
        },
      ];

      const mockSalesOrders = [
        {
          cabecalho: {
            codigo_pedido: "SALESORD001",
            numero_pedido: "2001",
            codigo_cliente: "CLI001",
            nome_cliente: "Cliente Exemplo 1",
            data_previsao: new Date("2024-01-10"),
            etapa: "aprovado",
            status: "approved",
            valor_total: 1500.75,
          },
          detalhes: [
            {
              codigo_item: "SALESITEM001",
              codigo_produto: "PROD001",
              descricao: "Produto Exemplo 1",
              quantidade: 15,
              unidade: "UN",
              valor_unitario: 100.50,
              valor_total: 1507.50,
            },
          ],
        },
      ];

      const mockSyncRecord = {
        id: "sync-123",
        syncType: "orders" as const,
        status: "in_progress" as const,
        startedAt: new Date(),
        itemsProcessed: 0,
        itemsFailed: 0,
      };

      vi.mocked(syncRepository.createSyncRecord).mockResolvedValue(mockSyncRecord);
      vi.mocked(omieGateway.getProductionOrders).mockResolvedValue({
        orders: mockProductionOrders,
        total: 1,
        page: 1,
        limit: 100,
      });
      vi.mocked(omieGateway.getSalesOrders).mockResolvedValue({
        orders: mockSalesOrders,
        total: 1,
        page: 1,
        limit: 100,
      });

      const request = {
        includeProductionOrders: true,
        includeSalesOrders: true,
        batchSize: 100,
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.data.totalOrders).toBe(2);
      expect(result.data.syncedOrders).toBe(2);
      expect(result.data.productionOrders).toBe(1);
      expect(result.data.salesOrders).toBe(1);
      expect(result.data.failedOrders).toBe(0);
    });

    it("deve filtrar pedidos por status", async () => {
      const mockProductionOrders = [
        {
          codigo_pedido: "PRODORD001",
          numero_pedido: "1001",
          codigo_cliente: "CLI001",
          nome_cliente: "Cliente Exemplo 1",
          data_previsao: new Date("2024-01-15"),
          etapa: "corte",
          status: "in_production",
          produtos: [],
        },
      ];

      const mockSyncRecord = {
        id: "sync-123",
        syncType: "orders" as const,
        status: "in_progress" as const,
        startedAt: new Date(),
        itemsProcessed: 0,
        itemsFailed: 0,
      };

      vi.mocked(syncRepository.createSyncRecord).mockResolvedValue(mockSyncRecord);
      vi.mocked(omieGateway.getProductionOrders).mockResolvedValue({
        orders: mockProductionOrders,
        total: 1,
        page: 1,
        limit: 100,
      });

      const request = {
        includeProductionOrders: true,
        includeSalesOrders: false,
        orderStatus: "in_production",
        batchSize: 100,
      };

      await useCase.execute(request);

      expect(omieGateway.getProductionOrders).toHaveBeenCalledWith({
        page: 1,
        limit: 100,
        status: "in_production",
        dateFrom: undefined,
        dateTo: undefined,
      });
    });

    it("deve filtrar pedidos por data", async () => {
      const mockSalesOrders = [
        {
          cabecalho: {
            codigo_pedido: "SALESORD001",
            numero_pedido: "2001",
            codigo_cliente: "CLI001",
            nome_cliente: "Cliente Exemplo 1",
            data_previsao: new Date("2024-01-10"),
            etapa: "aprovado",
            status: "approved",
            valor_total: 1500.75,
          },
          detalhes: [],
        },
      ];

      const mockSyncRecord = {
        id: "sync-123",
        syncType: "orders" as const,
        status: "in_progress" as const,
        startedAt: new Date(),
        itemsProcessed: 0,
        itemsFailed: 0,
      };

      vi.mocked(syncRepository.createSyncRecord).mockResolvedValue(mockSyncRecord);
      vi.mocked(omieGateway.getSalesOrders).mockResolvedValue({
        orders: mockSalesOrders,
        total: 1,
        page: 1,
        limit: 100,
      });

      const dateFrom = new Date("2024-01-01");
      const dateTo = new Date("2024-01-31");

      const request = {
        includeProductionOrders: false,
        includeSalesOrders: true,
        dateFrom: dateFrom.toISOString(),
        dateTo: dateTo.toISOString(),
        batchSize: 100,
      };

      await useCase.execute(request);

      expect(omieGateway.getSalesOrders).toHaveBeenCalledWith({
        page: 1,
        limit: 100,
        status: undefined,
        dateFrom,
        dateTo,
      });
    });

    it("deve lidar com exceções durante a sincronização", async () => {
      const mockSyncRecord = {
        id: "sync-123",
        syncType: "orders" as const,
        status: "in_progress" as const,
        startedAt: new Date(),
        itemsProcessed: 0,
        itemsFailed: 0,
      };

      vi.mocked(syncRepository.createSyncRecord).mockResolvedValue(mockSyncRecord);
      vi.mocked(omieGateway.getProductionOrders).mockRejectedValue(new Error("API Omie indisponível"));

      const request = {
        includeProductionOrders: true,
        includeSalesOrders: false,
        batchSize: 100,
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.message).toContain("Erro na sincronização");
      expect(result.data.totalOrders).toBe(0);
      expect(result.data.syncedOrders).toBe(0);
      expect(result.data.failedOrders).toBe(0);

      expect(logger.error).toHaveBeenCalledWith(
        "Erro na sincronização de pedidos",
        expect.objectContaining({
          error: "API Omie indisponível",
        })
      );
    });
  });
});