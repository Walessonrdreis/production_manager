// src/modules/omie-orders/infrastructure/db/omie-orders.repo.prisma.ts
import type { Prisma } from "@prisma/client";

export function createOmieOrdersRepoPrisma(prisma: any) {
  return {
    async upsertOrderWithItems(order: any, items: any[]) {
      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const savedOrder = await tx.omieOrder.upsert({
          where: { omieCode: order.omieCode },
          create: order as any,
          update: order as any,
          select: { id: true },
        });

        for (const it of items) {
          await tx.omieOrderItem.upsert({
            where: { omieItemCode: it.omieItemCode },
            create: { ...it, omieOrderId: savedOrder.id } as any,
            update: { ...it, omieOrderId: savedOrder.id } as any,
          });
        }
      });
    },

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
          ? {
              ...whereBase,
              omieCode: { notIn: normalizedCodes },
            }
          : whereBase;

      const result = await prisma.omieOrder.updateMany({
        where,
        data: {
          // Sai da etapa 20 no espelho local quando não aparece mais no snapshot atual.
          etapa: "OUT20",
          lastSyncAt: new Date(),
        },
      });

      return result.count ?? 0;
    },
  };
}
