import { PrismaClient } from "@prisma/client";
import {
  ProductionQueueItem,
  ProductionQueueStatistics,
  QueueReorderItem,
} from "../../application/entities/production-queue.entity";
import { ProductionQueueRepositoryPort } from "../../application/ports/production-queue.repository.port";
import {
  ListQueueRequest,
  UpdateQueueStatusRequest,
  QueueStatisticsRequest,
  ReorderQueueRequest,
} from "../../application/dtos/production-queue.dto";

export class ProductionQueueRepositoryPrisma implements ProductionQueueRepositoryPort {
  constructor(private readonly prisma: PrismaClient) {}

  async create(item: Omit<ProductionQueueItem, "id" | "createdAt" | "updatedAt">): Promise<ProductionQueueItem> {
    const record = await this.prisma.productionQueue.create({
      data: {
        orderId: item.orderId,
        priority: item.priority,
        status: item.status,
        position: item.position,
        estimatedStartDate: item.estimatedStartDate,
        scheduledDate: item.scheduledDate,
        notes: item.notes,
        completedAt: item.completedAt,
        metadata: item.metadata,
      },
    });

    return this.mapToDomain(record);
  }

  async update(id: string, updates: Partial<ProductionQueueItem>): Promise<ProductionQueueItem> {
    const record = await this.prisma.productionQueue.update({
      where: { id },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
    });

    return this.mapToDomain(record);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.productionQueue.delete({
      where: { id },
    });
  }

  async findById(id: string): Promise<ProductionQueueItem | null> {
    const record = await this.prisma.productionQueue.findUnique({
      where: { id },
    });

    return record ? this.mapToDomain(record) : null;
  }

  async findByOrderId(orderId: string): Promise<ProductionQueueItem | null> {
    const record = await this.prisma.productionQueue.findFirst({
      where: { orderId },
    });

    return record ? this.mapToDomain(record) : null;
  }

  async list(params: ListQueueRequest): Promise<{ items: ProductionQueueItem[]; total: number }> {
    const { page = 1, pageSize = 20, status, priority, dateFrom, dateTo } = params;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (priority) {
      where.priority = priority;
    }
    
    if (dateFrom || dateTo) {
      where.createdAt = {};
      
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    const [records, total] = await Promise.all([
      this.prisma.productionQueue.findMany({
        where,
        orderBy: [
          { priority: "desc" },
          { position: "asc" },
        ],
        skip,
        take: pageSize,
      }),
      this.prisma.productionQueue.count({ where }),
    ]);

    return {
      items: records.map(record => this.mapToDomain(record)),
      total,
    };
  }

  async getNextPosition(): Promise<number> {
    const lastItem = await this.prisma.productionQueue.findFirst({
      where: { status: { in: ["pending", "in_progress"] } },
      orderBy: { position: "desc" },
    });

    return lastItem ? lastItem.position + 1 : 1;
  }

  async reorderItems(items: QueueReorderItem[]): Promise<number> {
    const updates = items.map(item => 
      this.prisma.productionQueue.update({
        where: { id: item.id },
        data: { position: item.newPosition, updatedAt: new Date() },
      })
    );

    const results = await this.prisma.$transaction(updates);
    return results.length;
  }

  async updatePositionsAfterDeletion(deletedPosition: number): Promise<void> {
    await this.prisma.productionQueue.updateMany({
      where: {
        position: { gt: deletedPosition },
        status: { in: ["pending", "in_progress"] },
      },
      data: {
        position: { decrement: 1 },
        updatedAt: new Date(),
      },
    });
  }

  async getStatistics(params: QueueStatisticsRequest): Promise<ProductionQueueStatistics> {
    const { dateFrom, dateTo } = params;
    
    const where: any = {};
    
    if (dateFrom || dateTo) {
      where.createdAt = {};
      
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    const items = await this.prisma.productionQueue.findMany({
      where,
    });

    const domainItems = items.map(item => this.mapToDomain(item));
    
    // Calcular estatísticas usando a função do domínio
    const statistics = {
      totalOrders: domainItems.length,
      pendingOrders: domainItems.filter(item => item.status === "pending").length,
      inProgressOrders: domainItems.filter(item => item.status === "in_progress").length,
      completedOrders: domainItems.filter(item => item.status === "completed").length,
      cancelledOrders: domainItems.filter(item => item.status === "cancelled").length,
      averageCompletionTime: undefined as number | undefined,
      priorityDistribution: {
        high: domainItems.filter(item => item.priority === "high").length,
        medium: domainItems.filter(item => item.priority === "medium").length,
        low: domainItems.filter(item => item.priority === "low").length,
      },
      dailyThroughput: undefined as Array<{ date: string; completed: number }> | undefined,
    };

    // Calcular tempo médio de conclusão
    const completedItems = domainItems.filter(item => item.status === "completed" && item.completedAt);
    if (completedItems.length > 0) {
      const totalCompletionTime = completedItems.reduce((sum, item) => {
        const completionTime = item.completedAt!.getTime();
        const creationTime = item.createdAt.getTime();
        return sum + (completionTime - creationTime);
      }, 0);
      
      statistics.averageCompletionTime = totalCompletionTime / (completedItems.length * 1000 * 60 * 60); // horas
    }

    // Calcular throughput diário
    const dailyMap = new Map<string, number>();
    completedItems.forEach(item => {
      const dateStr = item.completedAt!.toISOString().split('T')[0];
      dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + 1);
    });
    
    if (dailyMap.size > 0) {
      statistics.dailyThroughput = Array.from(dailyMap.entries()).map(([date, completed]) => ({
        date,
        completed,
      }));
    }

    return statistics;
  }

  async updateStatus(id: string, statusUpdate: UpdateQueueStatusRequest): Promise<ProductionQueueItem> {
    const updates: any = {
      status: statusUpdate.status,
      updatedAt: new Date(),
    };

    if (statusUpdate.status === "completed") {
      updates.completedAt = statusUpdate.completedAt ? new Date(statusUpdate.completedAt) : new Date();
    }

    if (statusUpdate.notes) {
      updates.notes = statusUpdate.notes;
    }

    const record = await this.prisma.productionQueue.update({
      where: { id },
      data: updates,
    });

    return this.mapToDomain(record);
  }

  async countByStatus(status: ProductionQueueItem["status"]): Promise<number> {
    return this.prisma.productionQueue.count({
      where: { status },
    });
  }

  async countByPriority(priority: ProductionQueueItem["priority"]): Promise<number> {
    return this.prisma.productionQueue.count({
      where: { priority },
    });
  }

  async getItemsByPriority(priority: ProductionQueueItem["priority"]): Promise<ProductionQueueItem[]> {
    const records = await this.prisma.productionQueue.findMany({
      where: { priority },
      orderBy: { position: "asc" },
    });

    return records.map(record => this.mapToDomain(record));
  }

  async getPendingItems(): Promise<ProductionQueueItem[]> {
    const records = await this.prisma.productionQueue.findMany({
      where: { status: "pending" },
      orderBy: { position: "asc" },
    });

    return records.map(record => this.mapToDomain(record));
  }

  async getInProgressItems(): Promise<ProductionQueueItem[]> {
    const records = await this.prisma.productionQueue.findMany({
      where: { status: "in_progress" },
      orderBy: { position: "asc" },
    });

    return records.map(record => this.mapToDomain(record));
  }

  async cleanupOldItems(days: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await this.prisma.productionQueue.deleteMany({
      where: {
        status: { in: ["completed", "cancelled"] },
        updatedAt: { lt: cutoffDate },
      },
    });

    return result.count;
  }

  async validateOrderExists(orderId: string): Promise<boolean> {
    // Verificar se a ordem existe no sistema
    // Por enquanto, assumimos que todas as ordens existem
    // Em uma implementação real, faríamos uma consulta ao repositório de ordens
    return true;
  }

  async validatePositionAvailable(position: number): Promise<boolean> {
    const existing = await this.prisma.productionQueue.findFirst({
      where: { position, status: { in: ["pending", "in_progress"] } },
    });

    return !existing;
  }

  private mapToDomain(record: any): ProductionQueueItem {
    return {
      id: record.id,
      orderId: record.orderId,
      priority: record.priority as "high" | "medium" | "low",
      status: record.status as "pending" | "in_progress" | "completed" | "cancelled",
      position: record.position,
      estimatedStartDate: record.estimatedStartDate,
      scheduledDate: record.scheduledDate,
      notes: record.notes,
      completedAt: record.completedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      metadata: record.metadata,
    };
  }
}

export function createProductionQueueRepository(prisma: PrismaClient): ProductionQueueRepositoryPrisma {
  return new ProductionQueueRepositoryPrisma(prisma);
}