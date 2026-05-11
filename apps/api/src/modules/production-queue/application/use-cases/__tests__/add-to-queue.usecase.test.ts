import { describe, it, expect, beforeEach, vi } from "vitest";
import { AddToQueueUseCase } from "../add-to-queue.usecase";
import type { ProductionQueueRepositoryPort } from "../../ports/production-queue.repository.port";
import type { Logger } from "@/shared/logger";

describe("AddToQueueUseCase", () => {
  let useCase: AddToQueueUseCase;
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

    useCase = new AddToQueueUseCase({
      productionQueueRepository: mockRepository,
      logger: mockLogger,
    });
  });

  it("deve adicionar uma ordem à fila com sucesso", async () => {
    const mockOrderId = "123e4567-e89b-12d3-a456-426614174000";
    const mockRequest = {
      orderId: mockOrderId,
      priority: "medium" as const,
      notes: "Ordem de teste",
    };

    const mockCreatedItem = {
      id: "987e6543-e21b-43d3-b654-426614174000",
      orderId: mockOrderId,
      priority: "medium" as const,
      status: "pending" as const,
      position: 1,
      estimatedStartDate: new Date("2024-01-01T10:00:00Z"),
      scheduledDate: new Date("2024-01-01T09:00:00Z"),
      notes: "Ordem de teste",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(mockRepository.validateOrderExists).mockResolvedValue(true);
    vi.mocked(mockRepository.getNextPosition).mockResolvedValue(1);
    vi.mocked(mockRepository.create).mockResolvedValue(mockCreatedItem);

    const result = await useCase.execute(mockRequest);

    expect(result.success).toBe(true);
    expect(result.data.id).toBe(mockCreatedItem.id);
    expect(result.data.orderId).toBe(mockOrderId);
    expect(result.data.priority).toBe("medium");
    expect(result.data.status).toBe("pending");
    expect(result.data.position).toBe(1);
    expect(mockRepository.validateOrderExists).toHaveBeenCalledWith(mockOrderId);
    expect(mockRepository.getNextPosition).toHaveBeenCalled();
    expect(mockRepository.create).toHaveBeenCalledWith({
      orderId: mockOrderId,
      priority: "medium",
      status: "pending",
      position: 1,
      estimatedStartDate: expect.any(Date),
      scheduledDate: undefined,
      notes: "Ordem de teste",
    });
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining("Ordem adicionada à fila de produção")
    );
  });

  it("deve lançar erro quando ordem não existe", async () => {
    const mockOrderId = "123e4567-e89b-12d3-a456-426614174000";
    const mockRequest = {
      orderId: mockOrderId,
      priority: "high" as const,
    };

    vi.mocked(mockRepository.validateOrderExists).mockResolvedValue(false);

    await expect(useCase.execute(mockRequest)).rejects.toThrow(
      `Ordem com ID ${mockOrderId} não encontrada`
    );

    expect(mockRepository.validateOrderExists).toHaveBeenCalledWith(mockOrderId);
    expect(mockRepository.create).not.toHaveBeenCalled();
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining("Ordem não encontrada")
    );
  });

  it("deve usar prioridade baixa quando não especificada", async () => {
    const mockOrderId = "123e4567-e89b-12d3-a456-426614174000";
    const mockRequest = {
      orderId: mockOrderId,
    };

    const mockCreatedItem = {
      id: "987e6543-e21b-43d3-b654-426614174000",
      orderId: mockOrderId,
      priority: "low" as const,
      status: "pending" as const,
      position: 1,
      estimatedStartDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(mockRepository.validateOrderExists).mockResolvedValue(true);
    vi.mocked(mockRepository.getNextPosition).mockResolvedValue(1);
    vi.mocked(mockRepository.create).mockResolvedValue(mockCreatedItem);

    const result = await useCase.execute(mockRequest);

    expect(result.data.priority).toBe("low");
    expect(mockRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        priority: "low",
      })
    );
  });

  it("deve calcular data estimada de início baseada na prioridade", async () => {
    const mockOrderId = "123e4567-e89b-12d3-a456-426614174000";
    const mockRequest = {
      orderId: mockOrderId,
      priority: "high" as const,
    };

    const mockCreatedItem = {
      id: "987e6543-e21b-43d3-b654-426614174000",
      orderId: mockOrderId,
      priority: "high" as const,
      status: "pending" as const,
      position: 1,
      estimatedStartDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(mockRepository.validateOrderExists).mockResolvedValue(true);
    vi.mocked(mockRepository.getNextPosition).mockResolvedValue(1);
    vi.mocked(mockRepository.create).mockResolvedValue(mockCreatedItem);

    const result = await useCase.execute(mockRequest);

    expect(result.data.priority).toBe("high");
    const callArgs = vi.mocked(mockRepository.create).mock.calls[0][0];
    expect(callArgs.estimatedStartDate).toBeInstanceOf(Date);
  });

  it("deve usar data agendada quando fornecida", async () => {
    const mockOrderId = "123e4567-e89b-12d3-a456-426614174000";
    const scheduledDate = new Date("2024-01-15T14:00:00Z");
    const mockRequest = {
      orderId: mockOrderId,
      scheduledDate: scheduledDate.toISOString(),
    };

    const mockCreatedItem = {
      id: "987e6543-e21b-43d3-b654-426614174000",
      orderId: mockOrderId,
      priority: "low" as const,
      status: "pending" as const,
      position: 1,
      estimatedStartDate: new Date(),
      scheduledDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(mockRepository.validateOrderExists).mockResolvedValue(true);
    vi.mocked(mockRepository.getNextPosition).mockResolvedValue(1);
    vi.mocked(mockRepository.create).mockResolvedValue(mockCreatedItem);

    const result = await useCase.execute(mockRequest);

    expect(result.data.scheduledDate).toEqual(scheduledDate);
    expect(mockRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        scheduledDate,
      })
    );
  });
});