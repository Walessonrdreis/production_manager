import { PrismaClient } from "@prisma/client";
import { AlertsRepositoryPort } from "../../application/ports/alerts.repository.port";
import { StockAlert } from "../../application/entities/stock-alert.entity";
import { AlertConfig } from "../../application/entities/alert-config.entity";
import { StockAlertsRequest } from "../../application/dtos/stock-alerts.dto";

export class AlertsRepositoryPrisma implements AlertsRepositoryPort {
  constructor(private readonly prisma: PrismaClient) {}

  // Alertas de estoque
  async createStockAlert(alert: Omit<StockAlert, "id" | "createdAt">): Promise<StockAlert> {
    const record = await (this.prisma as any).stockAlert.create({
      data: {
        productCode: alert.productCode,
        productDescription: alert.productDescription,
        currentStock: alert.currentStock,
        minimumStock: alert.minimumStock,
        severity: alert.severity,
        status: alert.status,
        resolvedAt: alert.resolvedAt,
        metadata: alert.metadata,
      },
    });

    return this.mapStockAlertToDomain(record);
  }

  async updateStockAlert(id: string, updates: Partial<StockAlert>): Promise<StockAlert> {
    const record = await (this.prisma as any).stockAlert.update({
      where: { id },
      data: {
        productCode: updates.productCode,
        productDescription: updates.productDescription,
        currentStock: updates.currentStock,
        minimumStock: updates.minimumStock,
        severity: updates.severity,
        status: updates.status,
        resolvedAt: updates.resolvedAt,
        metadata: updates.metadata,
      },
    });

    return this.mapStockAlertToDomain(record);
  }

  async getStockAlertById(id: string): Promise<StockAlert | null> {
    const record = await (this.prisma as any).stockAlert.findUnique({
      where: { id },
    });

    return record ? this.mapStockAlertToDomain(record) : null;
  }

  async getStockAlerts(params: StockAlertsRequest): Promise<{
    alerts: StockAlert[];
    total: number;
  }> {
    const where: any = {};

    if (params.severity) {
      where.severity = params.severity;
    }

    if (params.resolved !== undefined) {
      if (params.resolved) {
        where.status = { in: ["resolved", "acknowledged"] };
      } else {
        where.status = "active";
      }
    }

    if (params.productCode) {
      where.productCode = params.productCode;
    }

    if (params.dateFrom) {
      where.createdAt = {
        gte: new Date(params.dateFrom),
      };
    }

    if (params.dateTo) {
      where.createdAt = {
        ...where.createdAt,
        lte: new Date(params.dateTo),
      };
    }

    const [alerts, total] = await Promise.all([
      (this.prisma as any).stockAlert.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      (this.prisma as any).stockAlert.count({ where }),
    ]);

    return {
      alerts: alerts.map(record => this.mapStockAlertToDomain(record)),
      total,
    };
  }

  async getActiveStockAlerts(): Promise<StockAlert[]> {
    const records = await (this.prisma as any).stockAlert.findMany({
      where: { status: "active" },
      orderBy: { createdAt: "desc" },
    });

    return records.map(record => this.mapStockAlertToDomain(record));
  }

  async resolveStockAlert(id: string, notes?: string): Promise<StockAlert> {
    const record = await (this.prisma as any).stockAlert.update({
      where: { id },
      data: {
        status: "resolved",
        resolvedAt: new Date(),
        metadata: notes ? { resolutionNotes: notes } : undefined,
      },
    });

    return this.mapStockAlertToDomain(record);
  }

  // Configurações de alerta
  async createAlertConfig(config: Omit<AlertConfig, "id" | "createdAt" | "updatedAt">): Promise<AlertConfig> {
    const record = await (this.prisma as any).alertConfig.create({
      data: {
        productCode: config.productCode,
        criticalThreshold: config.criticalThreshold,
        warningThreshold: config.warningThreshold,
        notificationChannels: config.notificationChannels,
        autoResolveDays: config.autoResolveDays,
      },
    });

    return this.mapAlertConfigToDomain(record);
  }

  async updateAlertConfig(id: string, updates: Partial<AlertConfig>): Promise<AlertConfig> {
    const record = await (this.prisma as any).alertConfig.update({
      where: { id },
      data: {
        productCode: updates.productCode,
        criticalThreshold: updates.criticalThreshold,
        warningThreshold: updates.warningThreshold,
        notificationChannels: updates.notificationChannels,
        autoResolveDays: updates.autoResolveDays,
      },
    });

    return this.mapAlertConfigToDomain(record);
  }

  async getAlertConfigById(id: string): Promise<AlertConfig | null> {
    const record = await (this.prisma as any).alertConfig.findUnique({
      where: { id },
    });

    return record ? this.mapAlertConfigToDomain(record) : null;
  }

  async getAlertConfigByProductCode(productCode: string): Promise<AlertConfig | null> {
    const record = await (this.prisma as any).alertConfig.findUnique({
      where: { productCode },
    });

    return record ? this.mapAlertConfigToDomain(record) : null;
  }

  async getDefaultAlertConfig(): Promise<AlertConfig | null> {
    const record = await (this.prisma as any).alertConfig.findFirst({
      where: { productCode: null },
    });

    return record ? this.mapAlertConfigToDomain(record) : null;
  }

  async listAlertConfigs(): Promise<AlertConfig[]> {
    const records = await (this.prisma as any).alertConfig.findMany({
      orderBy: [{ productCode: "asc" }, { updatedAt: "desc" }],
    });

    return records.map(record => this.mapAlertConfigToDomain(record));
  }

  // Métricas e estatísticas
  async getAlertStats(): Promise<{
    totalAlerts: number;
    activeAlerts: number;
    resolvedAlerts: number;
    criticalCount: number;
    warningCount: number;
    infoCount: number;
    byProduct: Array<{
      productCode: string;
      productDescription: string;
      alertCount: number;
    }>;
  }> {
    const [
      totalAlerts,
      activeAlerts,
      resolvedAlerts,
      criticalCount,
      warningCount,
      infoCount,
      byProductRaw,
    ] = await Promise.all([
      (this.prisma as any).stockAlert.count(),
      (this.prisma as any).stockAlert.count({ where: { status: "active" } }),
      (this.prisma as any).stockAlert.count({ where: { status: { in: ["resolved", "acknowledged"] } } }),
      (this.prisma as any).stockAlert.count({ where: { severity: "critical" } }),
      (this.prisma as any).stockAlert.count({ where: { severity: "warning" } }),
      (this.prisma as any).stockAlert.count({ where: { severity: "info" } }),
      (this.prisma as any).stockAlert.groupBy({
        by: ["productCode", "productDescription"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      }),
    ]);

    const byProduct = byProductRaw.map(item => ({
      productCode: item.productCode,
      productDescription: item.productDescription,
      alertCount: item._count.id,
    }));

    return {
      totalAlerts,
      activeAlerts,
      resolvedAlerts,
      criticalCount,
      warningCount,
      infoCount,
      byProduct,
    };
  }

  // Limpeza de alertas antigos
  async cleanupOldAlerts(days: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await (this.prisma as any).stockAlert.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        status: { in: ["resolved", "acknowledged"] },
      },
    });

    return result.count;
  }

  // Métodos de mapeamento
  private mapStockAlertToDomain(record: any): StockAlert {
    return {
      id: record.id,
      productCode: record.productCode,
      productDescription: record.productDescription,
      currentStock: Number(record.currentStock),
      minimumStock: Number(record.minimumStock),
      severity: record.severity as "critical" | "warning" | "info",
      status: record.status as "active" | "resolved" | "acknowledged",
      createdAt: record.createdAt,
      resolvedAt: record.resolvedAt,
      metadata: record.metadata,
    };
  }

  private mapAlertConfigToDomain(record: any): AlertConfig {
    return {
      id: record.id,
      productCode: record.productCode || undefined,
      criticalThreshold: Number(record.criticalThreshold),
      warningThreshold: Number(record.warningThreshold),
      notificationChannels: record.notificationChannels as Array<"email" | "sms" | "dashboard">,
      autoResolveDays: record.autoResolveDays,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}

export function createAlertsRepository(prisma: PrismaClient): AlertsRepositoryPort {
  return new AlertsRepositoryPrisma(prisma);
}