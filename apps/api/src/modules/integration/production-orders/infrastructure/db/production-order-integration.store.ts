import { prisma } from "@/shared/db/prisma";

export type IntegrationStatus = "ACCEPTED" | "CONFIRMED" | "FAILED";

export type ProductionOrderIntegrationRecord = {
  externalRequestId: string;
  productId: string;
  quantity: number;
  scheduledDate?: string;
  notes?: string;

  status: IntegrationStatus;

  omieProductionOrderId?: number;

  createdAt: string;
  updatedAt: string;

  lastError?: {
    code: string;
    message: string;
  };
};

export const productionOrderIntegrationStore = {
  async upsertAccepted(
    input: Omit<
      ProductionOrderIntegrationRecord,
      "status" | "createdAt" | "updatedAt" | "lastError"
    >
  ): Promise<ProductionOrderIntegrationRecord> {
    const record = await prisma.productionOrderIntegration.upsert({
      where: { externalRequestId: input.externalRequestId },
      create: {
        externalRequestId: input.externalRequestId,
        productId: input.productId,
        quantity: input.quantity,
        scheduledDate: input.scheduledDate,
        notes: input.notes,
        status: "ACCEPTED",
      },
      update: {
        productId: input.productId,
        quantity: input.quantity,
        scheduledDate: input.scheduledDate,
        notes: input.notes,
        status: "ACCEPTED",
        lastError: null,
      },
    });

    return {
      externalRequestId: record.externalRequestId,
      productId: record.productId,
      quantity: record.quantity,
      scheduledDate: record.scheduledDate ?? undefined,
      notes: record.notes ?? undefined,
      status: record.status as IntegrationStatus,
      omieProductionOrderId: record.omieProductionOrderId
        ? Number(record.omieProductionOrderId)
        : undefined,
      lastError: (record.lastError as any) ?? undefined,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  },

  async markConfirmed(
    externalRequestId: string,
    omieProductionOrderId?: number
  ): Promise<ProductionOrderIntegrationRecord | null> {
    // se não existir, retorna null (mantém sem quebrar)
    const existing = await prisma.productionOrderIntegration.findUnique({
      where: { externalRequestId },
    });
    if (!existing) return null;

    const record = await prisma.productionOrderIntegration.update({
      where: { externalRequestId },
      data: {
        status: "CONFIRMED",
        omieProductionOrderId:
          omieProductionOrderId != null ? String(omieProductionOrderId) : undefined,
        lastError: null,
      },
    });

    return {
      externalRequestId: record.externalRequestId,
      productId: record.productId,
      quantity: record.quantity,
      scheduledDate: record.scheduledDate ?? undefined,
      notes: record.notes ?? undefined,
      status: record.status as IntegrationStatus,
      omieProductionOrderId: record.omieProductionOrderId
        ? Number(record.omieProductionOrderId)
        : undefined,
      lastError: (record.lastError as any) ?? undefined,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  },

  async markFailed(
    externalRequestId: string,
    err: { code: string; message: string }
  ): Promise<ProductionOrderIntegrationRecord | null> {
    const existing = await prisma.productionOrderIntegration.findUnique({
      where: { externalRequestId },
    });
    if (!existing) return null;

    const record = await prisma.productionOrderIntegration.update({
      where: { externalRequestId },
      data: {
        status: "FAILED",
        lastError: err,
      },
    });

    return {
      externalRequestId: record.externalRequestId,
      productId: record.productId,
      quantity: record.quantity,
      scheduledDate: record.scheduledDate ?? undefined,
      notes: record.notes ?? undefined,
      status: record.status as IntegrationStatus,
      omieProductionOrderId: record.omieProductionOrderId
        ? Number(record.omieProductionOrderId)
        : undefined,
      lastError: (record.lastError as any) ?? undefined,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  },

  async getByExternalRequestId(
    externalRequestId: string
  ): Promise<ProductionOrderIntegrationRecord | null> {
    const record = await prisma.productionOrderIntegration.findUnique({
      where: { externalRequestId },
    });

    if (!record) return null;

    return {
      externalRequestId: record.externalRequestId,
      productId: record.productId,
      quantity: record.quantity,
      scheduledDate: record.scheduledDate ?? undefined,
      notes: record.notes ?? undefined,
      status: record.status as IntegrationStatus,
      omieProductionOrderId: record.omieProductionOrderId
        ? Number(record.omieProductionOrderId)
        : undefined,
      lastError: (record.lastError as any) ?? undefined,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  },

  async listByProductId(productId: string): Promise<ProductionOrderIntegrationRecord[]> {
    const records = await prisma.productionOrderIntegration.findMany({
      where: { productId },
      orderBy: { createdAt: "desc" },
    });

    return records.map((record) => ({
      externalRequestId: record.externalRequestId,
      productId: record.productId,
      quantity: record.quantity,
      scheduledDate: record.scheduledDate ?? undefined,
      notes: record.notes ?? undefined,
      status: record.status as IntegrationStatus,
      omieProductionOrderId: record.omieProductionOrderId
        ? Number(record.omieProductionOrderId)
        : undefined,
      lastError: (record.lastError as any) ?? undefined,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    }));
  },
};