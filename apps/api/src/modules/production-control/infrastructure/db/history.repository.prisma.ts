import { PrismaClient } from "@prisma/client";
import { HistoryRepository } from "@/modules/production-control/application/ports/history.repository.port";
import { History } from "@/modules/production-control/application/entities/history.entity";
import { HistoryDTO } from "@/modules/production-control/application/dtos/history.dto";
import { ProductionControlHistoryAction } from "@/modules/production-control/application/entities/production-control-history-action.enum";

export class HistoryRepositoryPrisma implements HistoryRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async createHistory(history: History): Promise<History> {
    const created = await this.prisma.productionControlHistory.create({
      data: {
        orderId: history.orderId,
        productId: history.productId,
        action: history.action as string,
        details: history.details,
      },
    });

    return HistoryDTO.fromPrisma(created);
  }

  async createHistories(histories: History[]): Promise<History[]> {
    const created = await this.prisma.productionControlHistory.createManyAndReturn({
      data: histories.map(history => ({
        orderId: history.orderId,
        productId: history.productId,
        action: history.action as string,
        details: history.details,
      })),
    });

    return created.map(HistoryDTO.fromPrisma);
  }

  async findHistoryById(id: string): Promise<History | null> {
    const history = await this.prisma.productionControlHistory.findUnique({
      where: { id },
    });

    if (!history) {
      return null;
    }

    return HistoryDTO.fromPrisma(history);
  }

  async findHistoriesByOrderId(orderId: string): Promise<History[]> {
    const histories = await this.prisma.productionControlHistory.findMany({
      where: { orderId },
      orderBy: {
        createdAt: "desc",
      },
    });

    return histories.map(HistoryDTO.fromPrisma);
  }

  async findHistoriesByProductId(productId: string): Promise<History[]> {
    const histories = await this.prisma.productionControlHistory.findMany({
      where: { productId },
      orderBy: {
        createdAt: "desc",
      },
    });

    return histories.map(HistoryDTO.fromPrisma);
  }

  async findHistoriesByAction(action: ProductionControlHistoryAction): Promise<History[]> {
    const histories = await this.prisma.productionControlHistory.findMany({
      where: { action: action as string },
      orderBy: {
        createdAt: "desc",
      },
    });

    return histories.map(HistoryDTO.fromPrisma);
  }

  async listHistories(options?: {
    limit?: number;
    offset?: number;
    orderBy?: "createdAt";
    orderDirection?: "asc" | "desc";
    orderId?: string;
    productId?: string;
    action?: ProductionControlHistoryAction;
  }): Promise<History[]> {
    const {
      limit = 100,
      offset = 0,
      orderBy = "createdAt",
      orderDirection = "desc",
      orderId,
      productId,
      action,
    } = options || {};

    const where: any = {};
    if (orderId) where.orderId = orderId;
    if (productId) where.productId = productId;
    if (action) where.action = action as string;

    const histories = await this.prisma.productionControlHistory.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: {
        [orderBy]: orderDirection,
      },
    });

    return histories.map(HistoryDTO.fromPrisma);
  }

  async countHistories(options?: {
    orderId?: string;
    productId?: string;
    action?: ProductionControlHistoryAction;
  }): Promise<number> {
    const { orderId, productId, action } = options || {};

    const where: any = {};
    if (orderId) where.orderId = orderId;
    if (productId) where.productId = productId;
    if (action) where.action = action as string;

    return await this.prisma.productionControlHistory.count({ where });
  }

  async getOrderHistorySummary(orderId: string): Promise<{
    totalActions: number;
    lastAction?: History;
    actionsByType: Record<string, number>;
  }> {
    const histories = await this.findHistoriesByOrderId(orderId);

    const actionsByType: Record<string, number> = {};
    histories.forEach(history => {
      actionsByType[history.action] = (actionsByType[history.action] || 0) + 1;
    });

    return {
      totalActions: histories.length,
      lastAction: histories[0],
      actionsByType,
    };
  }

  async getProductHistorySummary(productId: string): Promise<{
    totalActions: number;
    lastAction?: History;
    actionsByType: Record<string, number>;
  }> {
    const histories = await this.findHistoriesByProductId(productId);

    const actionsByType: Record<string, number> = {};
    histories.forEach(history => {
      actionsByType[history.action] = (actionsByType[history.action] || 0) + 1;
    });

    return {
      totalActions: histories.length,
      lastAction: histories[0],
      actionsByType,
    };
  }

  async deleteHistory(id: string): Promise<boolean> {
    try {
      await this.prisma.productionControlHistory.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async deleteHistoriesByOrderId(orderId: string): Promise<number> {
    const result = await this.prisma.productionControlHistory.deleteMany({
      where: { orderId },
    });

    return result.count;
  }

  async deleteHistoriesByProductId(productId: string): Promise<number> {
    const result = await this.prisma.productionControlHistory.deleteMany({
      where: { productId },
    });

    return result.count;
  }

  async cleanupOldHistories(options?: {
    olderThanDays?: number;
    keepLast?: number;
  }): Promise<number> {
    const { olderThanDays = 90, keepLast = 1000 } = options || {};

    // Primeiro, obtemos os IDs dos históricos mais recentes que queremos manter
    const recentHistories = await this.prisma.productionControlHistory.findMany({
      take: keepLast,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
      },
    });

    const recentHistoryIds = recentHistories.map(h => h.id);

    // Calculamos a data limite
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    // Deletamos históricos antigos que não estão na lista dos mais recentes
    const result = await this.prisma.productionControlHistory.deleteMany({
      where: {
        AND: [
          {
            createdAt: {
              lt: cutoffDate,
            },
          },
          {
            id: {
              notIn: recentHistoryIds,
            },
          },
        ],
      },
    });

    return result.count;
  }

  async searchHistories(
    query: string,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<History[]> {
    const { limit = 50, offset = 0 } = options || {};

    const histories = await this.prisma.productionControlHistory.findMany({
      where: {
        OR: [
          {
            details: {
              path: ["description"],
              string_contains: query,
            },
          },
          {
            details: {
              path: ["orderNumber"],
              string_contains: query,
            },
          },
          {
            details: {
              path: ["clientName"],
              string_contains: query,
            },
          },
        ],
      },
      take: limit,
      skip: offset,
      orderBy: {
        createdAt: "desc",
      },
    });

    return histories.map(HistoryDTO.fromPrisma);
  }
}