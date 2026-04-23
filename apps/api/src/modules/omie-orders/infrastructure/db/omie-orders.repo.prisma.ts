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
  };
}