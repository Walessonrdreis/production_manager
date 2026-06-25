// ---------------------------------------------------------------------------
// ProductionOrderReadModelStore — CRUD puro, sem lógica de negócio
// ---------------------------------------------------------------------------
// Segue o padrão de ProductCatalogProductionReadyReadModelStore.
// Apenas persistência — cálculos e flags ficam no UseCase.
// ---------------------------------------------------------------------------

import { prisma } from "@/shared/db/prisma";

export type MaterialItem = {
  componentCode: string;
  componentName: string | null;
  unit: string | null;
  quantityPerUnit: number;
  lossPercent: number | null;
  totalRequired: number;
  currentStock: number;
  projectedStock: number;
  status: "MISSING" | "CRITICAL" | "PARTIAL" | "OK";
};

export type MaterialsSummary = {
  totalComponents: number;
  missingCount: number;
  criticalCount: number;
  partialCount: number;
  okCount: number;
};

export type ReadinessInfo = {
  canStartProduction: boolean;
  blockingReasons: string[];
  warnings: string[];
};

export type ProductionOrderReadModelRecord = {
  omieCode: string;
  orderNumber: string | null;
  productCode: string | null;
  productName: string | null;
  productUnit: string | null;
  quantity: number;
  stage: string | null;
  operationalStatus: string;
  isOpen: boolean;
  isLate: boolean;
  isReady: boolean;
  isBlocked: boolean;
  hasStockIssue: boolean;
  hasMissingMaterials: boolean;
  hasCriticalMaterial: boolean;
  hasPartialStock: boolean;
  priority: string;
  expectedAt: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  daysOverdue: number;
  materialsJson: MaterialItem[] | null;
  materialsSummaryJson: MaterialsSummary | null;
  readinessJson: ReadinessInfo | null;
  alertsJson: string[] | null;
  lastSyncAt: Date | null;
};

export type ListOpenOrdersParams = {
  limit?: number;
  offset?: number;
  priority?: string;
  operationalStatus?: string;
  isLate?: boolean;
  isBlocked?: boolean;
  hasStockIssue?: boolean;
};

export class ProductionOrderReadModelStore {
  // ─── Substituição total (usado no refresh) ──────────────────────────

  async replaceAll(records: ProductionOrderReadModelRecord[]) {
    await prisma.$transaction(async (tx) => {
      await tx.productionOrderReadModel.deleteMany({});

      if (records.length === 0) {
        return;
      }

      await tx.productionOrderReadModel.createMany({
        data: records.map((r) => ({
          omieCode: r.omieCode,
          orderNumber: r.orderNumber,
          productCode: r.productCode,
          productName: r.productName,
          productUnit: r.productUnit,
          quantity: Number(r.quantity),
          stage: r.stage,
          operationalStatus: r.operationalStatus,
          isOpen: r.isOpen,
          isLate: r.isLate,
          isReady: r.isReady,
          isBlocked: r.isBlocked,
          hasStockIssue: r.hasStockIssue,
          hasMissingMaterials: r.hasMissingMaterials,
          hasCriticalMaterial: r.hasCriticalMaterial,
          hasPartialStock: r.hasPartialStock,
          priority: r.priority,
          expectedAt: r.expectedAt,
          startedAt: r.startedAt,
          completedAt: r.completedAt,
          daysOverdue: r.daysOverdue,
          materialsJson: r.materialsJson as any,
          materialsSummaryJson: r.materialsSummaryJson as any,
          readinessJson: r.readinessJson as any,
          alertsJson: r.alertsJson as any,
          lastSyncAt: r.lastSyncAt,
        })),
      });
    });
  }

  // ─── Upsert individual (para refresh de uma OP só) ──────────────────

  async upsertOne(record: ProductionOrderReadModelRecord) {
    await prisma.productionOrderReadModel.upsert({
      where: { omieCode: record.omieCode },
      create: {
        omieCode: record.omieCode,
        orderNumber: record.orderNumber,
        productCode: record.productCode,
        productName: record.productName,
        productUnit: record.productUnit,
        quantity: Number(record.quantity),
        stage: record.stage,
        operationalStatus: record.operationalStatus,
        isOpen: record.isOpen,
        isLate: record.isLate,
        isReady: record.isReady,
        isBlocked: record.isBlocked,
        hasStockIssue: record.hasStockIssue,
        hasMissingMaterials: record.hasMissingMaterials,
        hasCriticalMaterial: record.hasCriticalMaterial,
        hasPartialStock: record.hasPartialStock,
        priority: record.priority,
        expectedAt: record.expectedAt,
        startedAt: record.startedAt,
        completedAt: record.completedAt,
        daysOverdue: record.daysOverdue,
        materialsJson: record.materialsJson as any,
        materialsSummaryJson: record.materialsSummaryJson as any,
        readinessJson: record.readinessJson as any,
        alertsJson: record.alertsJson as any,
        lastSyncAt: record.lastSyncAt,
      },
      update: {
        orderNumber: record.orderNumber,
        productCode: record.productCode,
        productName: record.productName,
        productUnit: record.productUnit,
        quantity: Number(record.quantity),
        stage: record.stage,
        operationalStatus: record.operationalStatus,
        isOpen: record.isOpen,
        isLate: record.isLate,
        isReady: record.isReady,
        isBlocked: record.isBlocked,
        hasStockIssue: record.hasStockIssue,
        hasMissingMaterials: record.hasMissingMaterials,
        hasCriticalMaterial: record.hasCriticalMaterial,
        hasPartialStock: record.hasPartialStock,
        priority: record.priority,
        expectedAt: record.expectedAt,
        startedAt: record.startedAt,
        completedAt: record.completedAt,
        daysOverdue: record.daysOverdue,
        materialsJson: record.materialsJson as any,
        materialsSummaryJson: record.materialsSummaryJson as any,
        readinessJson: record.readinessJson as any,
        alertsJson: record.alertsJson as any,
        lastSyncAt: record.lastSyncAt,
      },
    });
  }

  // ─── Listar OPs abertas (isOpen = true) ─────────────────────────────

  async listOpenOrders(params?: ListOpenOrdersParams) {
    const {
      limit = 100,
      offset = 0,
      priority,
      operationalStatus,
      isLate,
      isBlocked,
      hasStockIssue,
    } = params ?? {};

    const safeLimit = Math.max(1, Math.min(Number(limit || 100), 500));
    const safeOffset = Math.max(0, Number(offset || 0));

    const where: Record<string, unknown> = {
      isOpen: true,
    };

    if (priority) where.priority = priority;
    if (operationalStatus) where.operationalStatus = operationalStatus;
    if (isLate !== undefined) where.isLate = isLate;
    if (isBlocked !== undefined) where.isBlocked = isBlocked;
    if (hasStockIssue !== undefined) where.hasStockIssue = hasStockIssue;

    const [total, rows] = await Promise.all([
      prisma.productionOrderReadModel.count({ where: where as any }),
      prisma.productionOrderReadModel.findMany({
        where: where as any,
        orderBy: [
          { priority: "desc" },
          { daysOverdue: "desc" },
          { expectedAt: "asc" },
        ],
        take: safeLimit,
        skip: safeOffset,
      }),
    ]);

    return {
      summary: {
        total,
        returned: rows.length,
      },
      meta: {
        pageSize: safeLimit,
        offset: safeOffset,
      },
      data: rows,
    };
  }

  // ─── Buscar por omieCode ────────────────────────────────────────────

  async getByOmieCode(omieCode: string) {
    return prisma.productionOrderReadModel.findUnique({
      where: { omieCode },
    });
  }
}
