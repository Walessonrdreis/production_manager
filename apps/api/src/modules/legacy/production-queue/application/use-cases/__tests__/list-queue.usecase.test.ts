import { describe, it, expect, beforeEach, vi } from "vitest";
import { ListQueueUseCase } from "../list-queue.usecase";
import type { ProductionQueueRepositoryPort } from "../../ports/production-queue.repository.port";
import type { Logger } from "@/shared/logger";

describe("ListQueueUseCase", () => {
  let useCase: ListQueueUseCase;
  let mockRepository: ProductionQueueRepositoryPort;
  let mockLogger: Logger;

  beforeEach(() => {
    mockRepository = {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findById: vi.fn(),
      findByOrderId: vi.fn(),
      findAll: vi.fn(),
      count: vi.fn(),
      getNextPosition: vi.fn(),
      validateOrderExists: vi.fn(),
      getQueueStatistics: vi.fn(),
      reorderQueue: vi.fn(),
    };

    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    };

    useCase = new ListQueueUseCase({
      productionQueueRepository: mockRepository,
      logger: mockLogger,
    });
  });

  it("deve listar itens da fila com sucesso", async () => {
    const mockItems = [
      {
        id: "1",
        orderId: "order-1",
        priority: "high" as const,
        status: "pending" as const,
        position: 1,
        estimatedStartDate: new Date("2024-01-01T10:00:00Z"),
        createdAt: new Date("2024-01-01T09:00:00Z"),
        updatedAt: new Date("2024-01-01T09:00:00Z"),
      },
      {
        id: "2",
        orderId: "order-2",
        priority: "medium" as const,
        status: "in_progress" as const,
        position: 2,
        estimatedStartDate: new Date("2024-01-01T11:00:00Z"),
        createdAt: new Date("2024-01-01T09:30:00Z"),
        updatedAt: new Date("2024-01-01T09:30:00Z"),
      },
    ];

    const mockRequest = {
      page: 1,
      pageSize: 10,
      status: "pending" as const,
      priority: "high" as const,
    };

    vi.mocked(mockRepository.findAll).mockResolvedValue(mockItems);
    vi.mocked(mockRepository.count).mockResolvedValue(2);

    const result = await useCase.execute(mockRequest);

    expect(result.success).toBe(true);
    expect(result.data.items).toHaveLength(2);
    expect(result.data.pagination.totalItems).toBe(2);
    expect(result.data.pagination.totalPages).toBe(1);
    expect(result.data.pagination.currentPage).toBe(1);
    expect(result.data.pagination.pageSize).toBe(10);
    expect(result.data.items[0].id).toBe("1");
    expect(result.data.items[0].priority).toBe("high");
    expect(result.data.items[0].status).toBe("pending");
    expect(result.data.items[1].id).toBe("2");
    expect(result.data.items[1].priority).toBe("medium");
    expect(result.data.items[1].status).toBe("in_progress");
    expect(mockRepository.findAll).toHaveBeenCalledWith({
      page: 1,
      pageSize: 10,
      status: "pending",
      priority: "high",
    });
    expect(mockRepository.count).toHaveBeenCalledWith({
      status: "pending",
      priority: "high",
    });
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining("Listando itens da fila de produção")
    );
  });

  it("deve usar valores padrão quando parâmetros não fornecidos", async () => {
    const mockItems = [
      {
        id: "1",
        orderId: "order-1",
        priority: "low" as const,
        status: "pending" as const,
        position: 1,
        estimatedStartDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const mockRequest = {};

    vi.mocked(mockRepository.findAll).mockResolvedValue(mockItems);
    vi.mocked(mockRepository.count).mockResolvedValue(1);

    const result = await useCase.execute(mockRequest);

    expect(result.success).toBe(true);
    expect(result.data.items).toHaveLength(1);
    expect(mockRepository.findAll).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
      status: undefined,
      priority: undefined,
    });
    expect(mockRepository.count).toHaveBeenCalledWith({
      status: undefined,
      priority: undefined,
    });
  });

  it("deve calcular total de páginas corretamente", async () => {
    const mockItems = Array.from({ length: 25 }, (_, i) => ({
      id: `${i + 1}`,
      orderId: `order-${i + 1}`,
      priority: "medium" as const,
      status: "pending" as const,
      position: i + 1,
      estimatedStartDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const mockRequest = {
      page: 2,
      pageSize: 10,
    };

    vi.mocked(mockRepository.findAll).mockResolvedValue(mockItems.slice(10, 20));
    vi.mocked(mockRepository.count).mockResolvedValue(25);

    const result = await useCase.execute(mockRequest);

    expect(result.success).toBe(true);
    expect(result.data.pagination.totalItems).toBe(25);
    expect(result.data.pagination.totalPages).toBe(3);
    expect(result.data.pagination.currentPage).toBe(2);
    expect(result.data.pagination.pageSize).toBe(10);
    expect(result.data.items).toHaveLength(10);
  });

  it("deve lidar com fila vazia", async () => {
    const mockRequest = {
      page: 1,
      pageSize: 10,
    };

    vi.mocked(mockRepository.findAll).mockResolvedValue([]);
    vi.mocked(mockRepository.count).mockResolvedValue(0);

    const result = await useCase.execute(mockRequest);

    expect(result.success).toBe(true);
    expect(result.data.items).toHaveLength(0);
    expect(result.data.pagination.totalItems).toBe(0);
    expect(result.data.pagination.totalPages).toBe(0);
    expect(result.data.pagination.currentPage).toBe(1);
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining("Listando itens da fila de produção")
    );
  });

  it("deve filtrar por múltiplos status quando fornecido como array", async () => {
    const mockItems = [
      {
        id: "1",
        orderId: "order-1",
        priority: "high" as const,
        status: "pending" as const,
        position: 1,
        estimatedStartDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "2",
        orderId: "order-2",
        priority: "medium" as const,
        status: "in_progress" as const,
        position: 2,
        estimatedStartDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const mockRequest = {
      status: ["pending", "in_progress"] as const,
    };

    vi.mocked(mockRepository.findAll).mockResolvedValue(mockItems);
    vi.mocked(mockRepository.count).mockResolvedValue(2);

    const result = await useCase.execute(mockRequest);

    expect(result.success).toBe(true);
    expect(result.data.items).toHaveLength(2);
    expect(mockRepository.findAll).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
      status: ["pending", "in_progress"],
      priority: undefined,
    });
  });
});