import { describe, it, expect, beforeEach, vi } from "vitest";
import { CreateSnapshotUseCase } from "@/modules/production-control/application/use-cases/create-snapshot.usecase";
import { SnapshotService } from "@/modules/production-control/application/services/snapshot.service";
import { ReconciliationService } from "@/modules/production-control/application/services/reconciliation.service";
import { HistoryService } from "@/modules/production-control/application/services/history.service";
import { Stage20Fetcher } from "@/modules/production-control/application/ports/stage20-fetcher.port";
import { SnapshotRepository } from "@/modules/production-control/application/ports/snapshot.repository.port";
import { ProductRepository } from "@/modules/production-control/application/ports/product.repository.port";
import { OrderRepository } from "@/modules/production-control/application/ports/order.repository.port";
import { HistoryRepository } from "@/modules/production-control/application/ports/history.repository.port";
import { ProductionControlStatus } from "@/modules/production-control/application/entities/production-control-status.enum";
import { AppError } from "@/shared/errors";

// ✅ Mocks para os repositórios
const mockSnapshotRepository = {
  createSnapshot: vi.fn(),
  findSnapshotBySnapshotId: vi.fn(),
  getLatestSnapshot: vi.fn(),
  countSnapshots: vi.fn(),
  deleteSnapshot: vi.fn(),
  cleanupOldSnapshots: vi.fn(),
} as unknown as SnapshotRepository;

const mockProductRepository = {
  createProduct: vi.fn(),
  createProducts: vi.fn(),
  findProductById: vi.fn(),
  findProductsBySnapshotId: vi.fn(),
  findProductBySnapshotAndDescription: vi.fn(),
  updateProduct: vi.fn(),
  updateProductStatus: vi.fn(),
  updateProductPendingQuantity: vi.fn(),
  updateProductDates: vi.fn(),
  deleteProduct: vi.fn(),
  deleteProductsBySnapshotId: vi.fn(),
  countProductsBySnapshotId: vi.fn(),
  getProductWithOrders: vi.fn(),
  listProductsByStatus: vi.fn(),
  searchProducts: vi.fn(),
} as unknown as ProductRepository;

const mockOrderRepository = {
  createOrder: vi.fn(),
  createOrders: vi.fn(),
  findOrderById: vi.fn(),
  findOrdersByProductId: vi.fn(),
  findOrderByProductAndOrderNumber: vi.fn(),
  updateOrder: vi.fn(),
  toggleOrderCheck: vi.fn(),
  markOrderAsChecked: vi.fn(),
  markOrderAsUnchecked: vi.fn(),
  deleteOrder: vi.fn(),
  deleteOrdersByProductId: vi.fn(),
  countOrdersByProductId: vi.fn(),
  countCheckedOrdersByProductId: vi.fn(),
  getTotalQuantityByProductId: vi.fn(),
  getCheckedQuantityByProductId: vi.fn(),
  listOrdersByCheckedStatus: vi.fn(),
  searchOrders: vi.fn(),
  batchUpdateOrders: vi.fn(),
} as unknown as OrderRepository;

const mockHistoryRepository = {
  createHistory: vi.fn(),
  createHistories: vi.fn(),
  findHistoryById: vi.fn(),
  findHistoriesByOrderId: vi.fn(),
  findHistoriesByProductId: vi.fn(),
  findHistoriesByAction: vi.fn(),
  listHistories: vi.fn(),
  countHistories: vi.fn(),
  getOrderHistorySummary: vi.fn(),
  getProductHistorySummary: vi.fn(),
  deleteHistory: vi.fn(),
  deleteHistoriesByOrderId: vi.fn(),
  deleteHistoriesByProductId: vi.fn(),
  cleanupOldHistories: vi.fn(),
  searchHistories: vi.fn(),
} as unknown as HistoryRepository;

const mockStage20Fetcher = {
  fetchStage20Products: vi.fn(),
  hasStage20Data: vi.fn(),
  getStage20ProductByDescription: vi.fn(),
  getStage20OrderByOrderNumber: vi.fn(),
  validateStage20Data: vi.fn(),
} as unknown as Stage20Fetcher;

describe("CreateSnapshotUseCase", () => {
  let useCase: CreateSnapshotUseCase;
  let snapshotService: SnapshotService;
  let reconciliationService: ReconciliationService;
  let historyService: HistoryService;

  beforeEach(() => {
    // ✅ Limpa todos os mocks antes de cada teste
    vi.clearAllMocks();

    // ✅ Cria instâncias dos serviços
    snapshotService = new SnapshotService(
      mockSnapshotRepository,
      mockProductRepository,
      mockOrderRepository
    );

    reconciliationService = new ReconciliationService();

    historyService = new HistoryService(
      mockHistoryRepository,
      mockProductRepository,
      mockOrderRepository
    );

    // ✅ Cria o use case
    useCase = new CreateSnapshotUseCase(
      snapshotService,
      reconciliationService,
      historyService,
      mockStage20Fetcher
    );
  });

  describe("execute", () => {
    it("deve criar um snapshot com sucesso quando há dados do stage20", async () => {
      // ✅ Arrange
      const mockStage20Products = [
        {
          description: "Produto A",
          totalQuantity: 100,
          orders: [
            {
              orderId: "order-1",
              orderNumber: "ORD001",
              clientCode: "CL001",
              clientName: "Cliente 1",
              quantity: 50,
              productCode: "P001",
            },
            {
              orderId: "order-2",
              orderNumber: "ORD002",
              clientCode: "CL002",
              clientName: "Cliente 2",
              quantity: 50,
              productCode: "P001",
            },
          ],
        },
      ];

      const mockPreviousSnapshot = {
        id: "prev-snapshot-id",
        snapshotId: "prev-snapshot-123",
        description: "Snapshot anterior",
        createdAt: new Date("2026-05-17T10:00:00Z"),
      };

      const mockCreatedSnapshot = {
        id: "new-snapshot-id",
        snapshotId: "snapshot-123456",
        description: "Novo snapshot",
        createdAt: new Date("2026-05-18T10:00:00Z"),
      };

      const mockCreatedProducts = [
        {
          id: "product-1",
          snapshotId: "snapshot-123456",
          description: "Produto A",
          totalQuantity: 100,
          pendingQuantity: 100,
          status: ProductionControlStatus.PENDING,
          createdAt: new Date("2026-05-18T10:00:00Z"),
          updatedAt: new Date("2026-05-18T10:00:00Z"),
        },
      ];

      // ✅ Configura os mocks
      mockStage20Fetcher.fetchStage20Products.mockResolvedValue(
        mockStage20Products
      );
      mockSnapshotRepository.getLatestSnapshot.mockResolvedValue(
        mockPreviousSnapshot
      );
      mockSnapshotRepository.createSnapshot.mockResolvedValue(
        mockCreatedSnapshot
      );
      mockProductRepository.createProducts.mockResolvedValue(
        mockCreatedProducts
      );
      mockProductRepository.findProductsBySnapshotId.mockResolvedValue([]); // Sem produtos anteriores
      mockHistoryRepository.createHistories.mockResolvedValue([]);

      // ✅ Act
      const result = await useCase.execute();

      // ✅ Assert
      expect(result).toEqual({
        snapshotId: "snapshot-123456",
        newProducts: 1,
        updatedProducts: 0,
        completedProducts: 0,
      });

      expect(mockStage20Fetcher.fetchStage20Products).toHaveBeenCalledTimes(1);
      expect(mockSnapshotRepository.getLatestSnapshot).toHaveBeenCalledTimes(1);
      expect(mockSnapshotRepository.createSnapshot).toHaveBeenCalledTimes(1);
      expect(mockProductRepository.createProducts).toHaveBeenCalledTimes(1);
      expect(mockHistoryRepository.createHistories).toHaveBeenCalledTimes(1);
    });

    it("deve lançar erro quando não há dados do stage20", async () => {
      // ✅ Arrange
      mockStage20Fetcher.fetchStage20Products.mockResolvedValue([]);

      // ✅ Act & Assert
      await expect(useCase.execute()).rejects.toThrow(AppError);
      await expect(useCase.execute()).rejects.toMatchObject({
        code: "NO_STAGE20_DATA",
        message: "No stage20 products found to create snapshot",
      });

      expect(mockStage20Fetcher.fetchStage20Products).toHaveBeenCalledTimes(1);
      expect(mockSnapshotRepository.createSnapshot).not.toHaveBeenCalled();
      expect(mockProductRepository.createProducts).not.toHaveBeenCalled();
    });

    it("deve detectar produtos concluídos automaticamente", async () => {
      // ✅ Arrange
      const mockStage20Products = [
        {
          description: "Produto B",
          totalQuantity: 75,
          orders: [
            {
              orderId: "order-3",
              orderNumber: "ORD003",
              clientCode: "CL003",
              clientName: "Cliente 3",
              quantity: 75,
              productCode: "P002",
            },
          ],
        },
      ];

      const mockPreviousSnapshot = {
        id: "prev-snapshot-id",
        snapshotId: "prev-snapshot-123",
        description: "Snapshot anterior",
        createdAt: new Date("2026-05-17T10:00:00Z"),
      };

      const mockPreviousProducts = [
        {
          id: "old-product-1",
          snapshotId: "prev-snapshot-123",
          description: "Produto A", // Produto que não aparece mais
          totalQuantity: 100,
          pendingQuantity: 50,
          status: ProductionControlStatus.IN_PROGRESS,
          createdAt: new Date("2026-05-17T10:00:00Z"),
          updatedAt: new Date("2026-05-17T10:00:00Z"),
        },
      ];

      const mockCreatedSnapshot = {
        id: "new-snapshot-id",
        snapshotId: "snapshot-123456",
        description: "Novo snapshot",
        createdAt: new Date("2026-05-18T10:00:00Z"),
      };

      const mockCreatedProducts = [
        {
          id: "product-2",
          snapshotId: "snapshot-123456",
          description: "Produto B",
          totalQuantity: 75,
          pendingQuantity: 75,
          status: ProductionControlStatus.PENDING,
          createdAt: new Date("2026-05-18T10:00:00Z"),
          updatedAt: new Date("2026-05-18T10:00:00Z"),
        },
      ];

      // ✅ Configura os mocks
      mockStage20Fetcher.fetchStage20Products.mockResolvedValue(
        mockStage20Products
      );
      mockSnapshotRepository.getLatestSnapshot.mockResolvedValue(
        mockPreviousSnapshot
      );
      mockProductRepository.findProductsBySnapshotId.mockResolvedValue(
        mockPreviousProducts
      );
      mockSnapshotRepository.createSnapshot.mockResolvedValue(
        mockCreatedSnapshot
      );
      mockProductRepository.createProducts.mockResolvedValue(
        mockCreatedProducts
      );
      mockHistoryRepository.createHistories.mockResolvedValue([]);

      // ✅ Act
      const result = await useCase.execute();

      // ✅ Assert
      expect(result).toEqual({
        snapshotId: "snapshot-123456",
        newProducts: 1,
        updatedProducts: 0,
        completedProducts: 1, // Produto A foi concluído automaticamente
      });

      expect(mockProductRepository.updateProductStatus).toHaveBeenCalledWith(
        "old-product-1",
        ProductionControlStatus.COMPLETED
      );
    });

    it("deve atualizar produtos existentes com novas quantidades", async () => {
      // ✅ Arrange
      const mockStage20Products = [
        {
          description: "Produto A",
          totalQuantity: 150, // Quantidade aumentou
          orders: [
            {
              orderId: "order-1",
              orderNumber: "ORD001",
              clientCode: "CL001",
              clientName: "Cliente 1",
              quantity: 150,
              productCode: "P001",
            },
          ],
        },
      ];

      const mockPreviousSnapshot = {
        id: "prev-snapshot-id",
        snapshotId: "prev-snapshot-123",
        description: "Snapshot anterior",
        createdAt: new Date("2026-05-17T10:00:00Z"),
      };

      const mockPreviousProducts = [
        {
          id: "old-product-1",
          snapshotId: "prev-snapshot-123",
          description: "Produto A",
          totalQuantity: 100,
          pendingQuantity: 50,
          status: ProductionControlStatus.IN_PROGRESS,
          createdAt: new Date("2026-05-17T10:00:00Z"),
          updatedAt: new Date("2026-05-17T10:00:00Z"),
        },
      ];

      const mockCreatedSnapshot = {
        id: "new-snapshot-id",
        snapshotId: "snapshot-123456",
        description: "Novo snapshot",
        createdAt: new Date("2026-05-18T10:00:00Z"),
      };

      const mockCreatedProducts = [
        {
          id: "product-1",
          snapshotId: "snapshot-123456",
          description: "Produto A",
          totalQuantity: 150,
          pendingQuantity: 150,
          status: ProductionControlStatus.PENDING,
          createdAt: new Date("2026-05-18T10:00:00Z"),
          updatedAt: new Date("2026-05-18T10:00:00Z"),
        },
      ];

      // ✅ Configura os mocks
      mockStage20Fetcher.fetchStage20Products.mockResolvedValue(
        mockStage20Products
      );
      mockSnapshotRepository.getLatestSnapshot.mockResolvedValue(
        mockPreviousSnapshot
      );
      mockProductRepository.findProductsBySnapshotId.mockResolvedValue(
        mockPreviousProducts
      );
      mockSnapshotRepository.createSnapshot.mockResolvedValue(
        mockCreatedSnapshot
      );
      mockProductRepository.createProducts.mockResolvedValue(
        mockCreatedProducts
      );
      mockHistoryRepository.createHistories.mockResolvedValue([]);

      // ✅ Act
      const result = await useCase.execute();

      // ✅ Assert
      expect(result).toEqual({
        snapshotId: "snapshot-123456",
        newProducts: 0,
        updatedProducts: 1, // Produto A foi atualizado
        completedProducts: 0,
      });

      expect(mockProductRepository.updateProduct).toHaveBeenCalledWith(
        "old-product-1",
        expect.objectContaining({
          totalQuantity: 150,
          pendingQuantity: 150,
        })
      );
    });

    it("deve lidar com erros ao buscar dados do stage20", async () => {
      // ✅ Arrange
      const error = new Error("Falha na conexão com o endpoint");
      mockStage20Fetcher.fetchStage20Products.mockRejectedValue(error);

      // ✅ Act & Assert
      await expect(useCase.execute()).rejects.toThrow(AppError);
      await expect(useCase.execute()).rejects.toMatchObject({
        code: "STAGE20_FETCH_ERROR",
      });

      expect(mockStage20Fetcher.fetchStage20Products).toHaveBeenCalledTimes(1);
      expect(mockSnapshotRepository.createSnapshot).not.toHaveBeenCalled();
    });

    it("deve criar snapshot sem snapshot anterior", async () => {
      // ✅ Arrange
      const mockStage20Products = [
        {
          description: "Produto C",
          totalQuantity: 200,
          orders: [
            {
              orderId: "order-4",
              orderNumber: "ORD004",
              clientCode: "CL004",
              clientName: "Cliente 4",
              quantity: 200,
              productCode: "P003",
            },
          ],
        },
      ];

      const mockCreatedSnapshot = {
        id: "new-snapshot-id",
        snapshotId: "snapshot-123456",
        description: "Primeiro snapshot",
        createdAt: new Date("2026-05-18T10:00:00Z"),
      };

      const mockCreatedProducts = [
        {
          id: "product-3",
          snapshotId: "snapshot-123456",
          description: "Produto C",
          totalQuantity: 200,
          pendingQuantity: 200,
          status: ProductionControlStatus.PENDING,
          createdAt: new Date("2026-05-18T10:00:00Z"),
          updatedAt: new Date("2026-05-18T10:00:00Z"),
        },
      ];

      // ✅ Configura os mocks
      mockStage20Fetcher.fetchStage20Products.mockResolvedValue(
        mockStage20Products
      );
      mockSnapshotRepository.getLatestSnapshot.mockResolvedValue(null); // Sem snapshot anterior
      mockSnapshotRepository.createSnapshot.mockResolvedValue(
        mockCreatedSnapshot
      );
      mockProductRepository.createProducts.mockResolvedValue(
        mockCreatedProducts
      );
      mockHistoryRepository.createHistories.mockResolvedValue([]);

      // ✅ Act
      const result = await useCase.execute();

      // ✅ Assert
      expect(result).toEqual({
        snapshotId: "snapshot-123456",
        newProducts: 1,
        updatedProducts: 0,
        completedProducts: 0,
      });

      expect(mockSnapshotRepository.getLatestSnapshot).toHaveBeenCalledTimes(1);
      expect(mockProductRepository.findProductsBySnapshotId).not.toHaveBeenCalled(); // Não há snapshot anterior
    });
  });
});