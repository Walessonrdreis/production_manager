import { describe, it, expect, beforeEach, vi } from "vitest";
import { UpdateQueueStatusUseCase } from "../update-queue-status.usecase";
import type { ProductionQueueRepositoryPort } from "../../ports/production-queue.repository.port";
import type { Logger } from "@/shared/logger";

describe("UpdateQueueStatusUseCase", () => {
  let useCase: UpdateQueueStatusUseCase;
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

    useCase = new UpdateQueueStatusUseCase({
      productionQueueRepository: mockRepository,
      logger: mockLogger,
    });
  });

  it("deve atualizar status de um item na fila com sucesso", async () => {
    const mockItemId = "123e4567-e89b-12d3-a456-426614174000";
    const mockRequest = {
      id: mockItemId,
      status: "in_progress" as const,
      notes: "Iniciando produção",
    };

    const mockExistingItem = {
      id: mockItemId,
      orderId: "order-1",
      priority: "high" as const,
      status: "pending" as const,
      position: 1,
      estimatedStartDate: new Date("2024-01-01T10:00:00Z"),
      createdAt: new Date("2024-01-01T09:00:00Z"),
      updatedAt: new Date("2024-01-01T09:00:00Z"),
    };

    const mockUpdatedItem = {
      ...mockExistingItem,
      status: "in_progress" as const,
      notes: "Iniciando produção",
      updatedAt: new Date("2024-01-01T10:00:00Z"),
    };

    vi.mocked(mockRepository.findById).mockResolvedValue(mockExistingItem);
    vi.mocked(mockRepository.update).mockResolvedValue(mockUpdatedItem);

    const result = await useCase.execute(mockRequest);

    expect(result.success).toBe(true);
    expect(result.data.id).toBe(mockItemId);
    expect(result.data.status).toBe("in_progress");
    expect(result.data.notes).toBe("Iniciando produção");
    expect(mockRepository.findById).toHaveBeenCalledWith(mockItemId);
    expect(mockRepository.update).toHaveBeenCalledWith(mockItemId, {
      status: "in_progress",
      notes: "Iniciando produção",
    });
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining("Status atualizado para item na fila de produção")
    );
  });

  it("deve lançar erro quando item não existe", async () => {
    const mockItemId = "123e4567-e89b-12d3-a456-426614174000";
    const mockRequest = {
      id: mockItemId,
      status: "completed" as const,
    };

    vi.mocked(mockRepository.findById).mockResolvedValue(null);

    await expect(useCase.execute(mockRequest)).rejects.toThrow(
      `Item com ID ${mockItemId} não encontrado na fila de produção`
    );

    expect(mockRepository.findById).toHaveBeenCalledWith(mockItemId);
    expect(mockRepository.update).not.toHaveBeenCalled();
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining("Item não encontrado na fila de produção")
    );
  });

  it("deve atualizar completedAt quando status for completed", async () => {
    const mockItemId = "123e4567-e89b-12d3-a456-426614174000";
    const mockRequest = {
      id: mockItemId,
      status: "completed" as const,
    };

    const mockExistingItem = {
      id: mockItemId,
      orderId: "order-1",
      priority: "high" as const,
      status: "in_progress" as const,
      position: 1,
      estimatedStartDate: new Date("2024-01-01T10:00:00Z"),
      createdAt: new Date("2024-01-01T09:00:00Z"),
      updatedAt: new Date("2024-01-01T09:00:00Z"),
    };

    const mockUpdatedItem = {
      ...mockExistingItem,
      status: "completed" as const,
      completedAt: new Date("2024-01-01T11:00:00Z"),
      updatedAt: new Date("2024-01-01T11:00:00Z"),
    };

    vi.mocked(mockRepository.findById).mockResolvedValue(mockExistingItem);
    vi.mocked(mockRepository.update).mockResolvedValue(mockUpdatedItem);

    const result = await useCase.execute(mockRequest);

    expect(result.success).toBe(true);
    expect(result.data.status).toBe("completed");
    expect(result.data.completedAt).toBeInstanceOf(Date);
    expect(mockRepository.update).toHaveBeenCalledWith(mockItemId, {
      status: "completed",
      completedAt: expect.any(Date),
    });
  });

  it("deve limpar completedAt quando status mudar de completed para outro", async () => {
    const mockItemId = "123e4567-e89b-12d3-a456-426614174000";
    const mockRequest = {
      id: mockItemId,
      status: "pending" as const,
    };

    const mockExistingItem = {
      id: mockItemId,
      orderId: "order-1",
      priority: "high" as const,
      status: "completed" as const,
      position: 1,
      estimatedStartDate: new Date("2024-01-01T10:00:00Z"),
      completedAt: new Date("2024-01-01T11:00:00Z"),
      createdAt: new Date("2024-01-01T09:00:00Z"),
      updatedAt: new Date("2024-01-01T11:00:00Z"),
    };

    const mockUpdatedItem = {
      ...mockExistingItem,
      status: "pending" as const,
      completedAt: undefined,
      updatedAt: new Date("2024-01-01T12:00:00Z"),
    };

    vi.mocked(mockRepository.findById).mockResolvedValue(mockExistingItem);
    vi.mocked(mockRepository.update).mockResolvedValue(mockUpdatedItem);

    const result = await useCase.execute(mockRequest);

    expect(result.success).toBe(true);
    expect(result.data.status).toBe("pending");
    expect(result.data.completedAt).toBeUndefined();
    expect(mockRepository.update).toHaveBeenCalledWith(mockItemId, {
      status: "pending",
      completedAt: null,
    });
  });

  it("deve manter notes existentes quando não fornecidos novos", async () => {
    const mockItemId = "123e4567-e89b-12d3-a456-426614174000";
    const mockRequest = {
      id: mockItemId,
      status: "in_progress" as const,
    };

    const mockExistingItem = {
      id: mockItemId,
      orderId: "order-1",
      priority: "high" as const,
      status: "pending" as const,
      position: 1,
      estimatedStartDate: new Date("2024-01-01T10:00:00Z"),
      notes: "Notas existentes",
      createdAt: new Date("2024-01-01T09:00:00Z"),
      updatedAt: new Date("2024-01-01T09:00:00Z"),
    };

    const mockUpdatedItem = {
      ...mockExistingItem,
      status: "in_progress" as const,
      updatedAt: new Date("2024-01-01T10:00:00Z"),
    };

    vi.mocked(mockRepository.findById).mockResolvedValue(mockExistingItem);
    vi.mocked(mockRepository.update).mockResolvedValue(mockUpdatedItem);

    const result = await useCase.execute(mockRequest);

    expect(result.success).toBe(true);
    expect(result.data.notes).toBe("Notas existentes");
    expect(mockRepository.update).toHaveBeenCalledWith(mockItemId, {
      status: "in_progress",
    });
  });

  it("deve validar transições de status permitidas", async () => {
    const mockItemId = "123e4567-e89b-12d3-a456-426614174000";
    const mockRequest = {
      id: mockItemId,
      status: "cancelled" as const,
    };

    const mockExistingItem = {
      id: mockItemId,
      orderId: "order-1",
      priority: "high" as const,
      status: "completed" as const,
      position: 1,
      estimatedStartDate: new Date("2024-01-01T10:00:00Z"),
      createdAt: new Date("2024-01-01T09:00:00Z"),
      updatedAt: new Date("2024-01-01T09:00:00Z"),
    };

    vi.mocked(mockRepository.findById).mockResolvedValue(mockExistingItem);

    await expect(useCase.execute(mockRequest)).rejects.toThrow(
      "Transição de status inválida"
    );

    expect(mockRepository.update).not.toHaveBeenCalled();
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining("Transição de status inválida")
    );
  });
});