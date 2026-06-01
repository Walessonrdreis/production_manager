import { prisma } from "@/shared/db/prisma";
import { Prisma } from "@prisma/client";
import type { ProductionOrderIntegration as PrismaPOI } from "@prisma/client";

/**
 * Estados possíveis da integração de OP
 */
export type IntegrationStatus = "ACCEPTED" | "CONFIRMED" | "FAILED";

/**
 * Contrato do tracking de integração
 * (persistido no DB, ownership da API 1)
 */
export type ProductionOrderIntegrationRecord = {
  externalRequestId: string;
  productId: string;
  quantity: number;

  status: IntegrationStatus;

  omieProductionOrderId?: number;

  createdAt: string;
  updatedAt: string;

  lastError?: {
    code: string;
    message: string;
  };
};

/**
 * Mapper Prisma → contrato do módulo
 */
function toRecord(record: PrismaPOI): ProductionOrderIntegrationRecord {
  return {
    externalRequestId: record.externalRequestId,
    productId: record.productId,
    quantity: record.quantity,
    status: record.status as IntegrationStatus,
    omieProductionOrderId: record.omieProductionOrderId
      ? Number(record.omieProductionOrderId)
      : undefined,
    lastError: (record.lastError as any) ?? undefined,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

/**
 * HARDENING DO LIFECYCLE (estado monotônico)
 *
 * Estados:
 * - ACCEPTED → CONFIRMED ✅
 * - ACCEPTED → FAILED ✅
 *
 * Regras:
 * - CONFIRMED é terminal (por enquanto)
 * - FAILED é terminal
 * - Nunca regredir estado
 * - Métodos idempotentes
 */
export const productionOrderIntegrationStore = {
  /**
   * Registra a intenção de criação da OP.
   *
   * HARDENING:
   * - Se já CONFIRMED → noop
   * - Se já FAILED → noop
   * - Se ACCEPTED → atualiza dados
   */
  async upsertAccepted(input: {
    externalRequestId: string;
    productId: string;
    quantity: number;
  }): Promise<ProductionOrderIntegrationRecord> {
    const existing = await prisma.productionOrderIntegration.findUnique({
      where: { externalRequestId: input.externalRequestId },
    });

    if (existing) {
      if (existing.status === "CONFIRMED" || existing.status === "FAILED") {
        return toRecord(existing);
      }

      const updated = await prisma.productionOrderIntegration.update({
        where: { externalRequestId: input.externalRequestId },
        data: {
          productId: input.productId,
          quantity: input.quantity,
          status: "ACCEPTED",
          lastError: Prisma.JsonNull,

        },
      });

      return toRecord(updated);
    }

    const created = await prisma.productionOrderIntegration.create({
      data: {
        externalRequestId: input.externalRequestId,
        productId: input.productId,
        quantity: input.quantity,
        status: "ACCEPTED",
      },
    });

    return toRecord(created);
  },

  /**
   * Marca como CONFIRMED.
   *
   * HARDENING:
   * - Idempotente
   * - Não confirma se FAILED
   */
  async markConfirmed(
    externalRequestId: string,
    omieProductionOrderId?: number
  ): Promise<ProductionOrderIntegrationRecord | null> {
    const existing = await prisma.productionOrderIntegration.findUnique({
      where: { externalRequestId },
    });
    if (!existing) return null;

    if (existing.status === "CONFIRMED" || existing.status === "FAILED") {
      return toRecord(existing);
    }

    const updated = await prisma.productionOrderIntegration.update({
      where: { externalRequestId },
      data: {
        status: "CONFIRMED",
        omieProductionOrderId:
          omieProductionOrderId != null
            ? String(omieProductionOrderId)
            : existing.omieProductionOrderId,
        lastError: Prisma.JsonNull,

      },
    });

    return toRecord(updated);
  },

  /**
   * Marca como FAILED.
   *
   * HARDENING:
   * - Idempotente
   * - Não derruba CONFIRMED
   */
  async markFailed(
    externalRequestId: string,
    err: { code: string; message: string }
  ): Promise<ProductionOrderIntegrationRecord | null> {
    const existing = await prisma.productionOrderIntegration.findUnique({
      where: { externalRequestId },
    });
    if (!existing) return null;

    if (existing.status === "FAILED" || existing.status === "CONFIRMED") {
      return toRecord(existing);
    }

    const updated = await prisma.productionOrderIntegration.update({
      where: { externalRequestId },
      data: {
        status: "FAILED",
        lastError: err,
      },
    });

    return toRecord(updated);
  },

  /**
   * Consulta por externalRequestId
   */
  async getByExternalRequestId(
    externalRequestId: string
  ): Promise<ProductionOrderIntegrationRecord | null> {
    const record = await prisma.productionOrderIntegration.findUnique({
      where: { externalRequestId },
    });

    if (!record) return null;
    return toRecord(record);
  },

  /**
   * Lista integrações por produto
   */
  async listByProductId(
    productId: string
  ): Promise<ProductionOrderIntegrationRecord[]> {
    const records = await prisma.productionOrderIntegration.findMany({
      where: { productId },
      orderBy: { createdAt: "desc" },
    });

    return records.map(toRecord);
  },
};