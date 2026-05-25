// src/modules/omie-orders/infrastructure/db/omie-orders.repo.prisma.ts

import type { Prisma } from "@prisma/client";

/**
 * Tipo EXATO do que pode ser persistido em OmieOrder
 * (alinhado com schema.prisma)
 */
type OmieOrderPrismaInput = {
  omieCode: string;
  numeroPedido: string | null;
  codigoCliente: string | null;
  codigoEmpresa: string | null;
  etapa: string;
  cancelado: string;
  encerrado: string;
  dataPrevisao: Date | null;
  rawPayload: Prisma.InputJsonValue;
  lastSyncAt: Date;
};

/**
 * Sanitiza e garante que SOMENTE campos existentes no schema
 * sejam enviados ao Prisma.
 *
 * Campos Omie (snake_case) ficam exclusivamente no rawPayload.
 */
function sanitizeOrderForPrisma(order: any): OmieOrderPrismaInput {
  return {
    omieCode: String(order?.omieCode),
    numeroPedido: order?.numeroPedido != null ? String(order.numeroPedido) : null,
    codigoCliente: order?.codigoCliente != null ? String(order.codigoCliente) : null,
    codigoEmpresa: order?.codigoEmpresa != null ? String(order.codigoEmpresa) : null,

    etapa: order?.etapa != null ? String(order.etapa) : "20",
    cancelado: order?.cancelado != null ? String(order.cancelado) : "N",
    encerrado: order?.encerrado != null ? String(order.encerrado) : "N",

    dataPrevisao: order?.dataPrevisao ?? null,

    // ✅ TODOS os dados Omie (incluindo quantidade_itens)
    // ficam APENAS no rawPayload
    rawPayload: (order?.rawPayload ?? {}) as Prisma.InputJsonValue,

    lastSyncAt: new Date(),
  };
}

/**
 * Sanitiza item de pedido para OmieOrderItem
 * (alinhado com schema.prisma)
 */
function sanitizeItemForPrisma(it: any, omieOrderId: string) {
  return {
    omieItemCode: String(it?.omieItemCode),
    omieOrderId,

    omieProductCode: it?.omieProductCode != null ? String(it.omieProductCode) : null,
    sku: it?.sku != null ? String(it.sku) : null,

    description: String(it?.description ?? ""),
    unit: it?.unit != null ? String(it.unit) : null,

    // Decimal compatível com Prisma
    quantity: it?.quantity,
    unitPrice: it?.unitPrice ?? null,
    totalPrice: it?.totalPrice ?? null,

    rawPayload: (it?.rawPayload ?? {}) as Prisma.InputJsonValue,
    lastSyncAt: new Date(),
  };
}

export function createOmieOrdersRepoPrisma(prisma: any) {
  return {
    /**
     * Upsert de pedido + itens (idempotente)
     */
    async upsertOrderWithItems(order: any, items: any[]) {
      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const safeOrder = sanitizeOrderForPrisma(order);

        const savedOrder = await tx.omieOrder.upsert({
          where: { omieCode: safeOrder.omieCode },
          create: safeOrder,
          update: {
            numeroPedido: safeOrder.numeroPedido,
            codigoCliente: safeOrder.codigoCliente,
            codigoEmpresa: safeOrder.codigoEmpresa,
            etapa: safeOrder.etapa,
            cancelado: safeOrder.cancelado,
            encerrado: safeOrder.encerrado,
            dataPrevisao: safeOrder.dataPrevisao,
            rawPayload: safeOrder.rawPayload,
            lastSyncAt: safeOrder.lastSyncAt,
          },
          select: { id: true },
        });

        for (const it of items) {
          if (!it?.omieItemCode) continue;

          const safeItem = sanitizeItemForPrisma(it, savedOrder.id);

          await tx.omieOrderItem.upsert({
            where: { omieItemCode: safeItem.omieItemCode },
            create: safeItem,
            update: {
              omieOrderId: savedOrder.id,
              omieProductCode: safeItem.omieProductCode,
              sku: safeItem.sku,
              description: safeItem.description,
              unit: safeItem.unit,
              quantity: safeItem.quantity,
              unitPrice: safeItem.unitPrice,
              totalPrice: safeItem.totalPrice,
              rawPayload: safeItem.rawPayload,
              lastSyncAt: safeItem.lastSyncAt,
            },
          });
        }
      });
    },

    /**
     * Remove pedidos que saíram da etapa 20 no snapshot atual
     */
    async reconcileMissingStage20Orders(activeOmieCodes: string[]) {
      const normalizedCodes = Array.from(
        new Set((activeOmieCodes ?? []).map((c) => String(c ?? "").trim()).filter(Boolean))
      );

      const whereBase = {
        etapa: "20",
        cancelado: "N",
        encerrado: "N",
      };

      const where =
        normalizedCodes.length > 0
          ? { ...whereBase, omieCode: { notIn: normalizedCodes } }
          : whereBase;

      const result = await prisma.omieOrder.updateMany({
        where,
        data: {
          etapa: "OUT20",
          lastSyncAt: new Date(),
        },
      });

      return result.count ?? 0;
    },
  };
}
``