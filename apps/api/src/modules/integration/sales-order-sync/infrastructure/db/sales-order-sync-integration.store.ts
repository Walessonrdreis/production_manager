import type { PrismaClient, SalesOrder } from "@prisma/client";

export type UpsertSalesOrderInput = {
  omieId: string;
  orderNumber: string | null;
  stage: string;
  isCanceled: boolean;
  isClosed: boolean;
  customerOmieId: string | null;
  companyOmieId: string | null;
  forecastDate: Date | null;
  totalAmount: number | null;
  rawPayload: unknown;
};

export type UpsertSalesOrderItemInput = {
  omieItemId: string;
  productCode: string;
  productOmieId: string;
  description: string;
  unit: string | null;
  quantity: number;
  unitPrice: number | null;
  totalPrice: number | null;
  rawPayload: unknown;
};

export class SalesOrderSyncIntegrationStore {
  constructor(private readonly prisma: PrismaClient) { }

  async upsertSalesOrder(
    input: UpsertSalesOrderInput
  ): Promise<SalesOrder> {
    return this.prisma.salesOrder.upsert({
      where: { omieId: input.omieId },
      create: {
        ...input,
      },
      update: {
        ...input,
        lastSyncAt: new Date(),
      },
    });
  }

  async upsertSalesOrderItem(
    salesOrderId: string,
    input: UpsertSalesOrderItemInput
  ): Promise<SalesOrderItem> {
    return this.prisma.salesOrderItem.upsert({
      where: { omieItemId: input.omieItemId },
      create: {
        ...input,
        salesOrderId,
      },
      update: {
        ...input,
        salesOrderId,
        lastSyncAt: new Date(),
      },
    });
  }

  /**
   * Persiste um pedido e seus itens em uma única transação.
   */
  async saveOrderWithItems(
    order: UpsertSalesOrderInput,
    items: UpsertSalesOrderItemInput[]
  ): Promise<SalesOrder> {
    return this.prisma.$transaction(async (tx) => {
      const saved = await tx.salesOrder.upsert({
        where: { omieId: order.omieId },
        create: { ...order },
        update: { ...order, lastSyncAt: new Date() },
      });

      for (const item of items) {
        await tx.salesOrderItem.upsert({
          where: { omieItemId: item.omieItemId },
          create: { ...item, salesOrderId: saved.id },
          update: { ...item, salesOrderId: saved.id, lastSyncAt: new Date() },
        });
      }

      return saved;
    });
  }

  /**
   * Persiste múltiplos pedidos (cada um com seus itens) em batch,
   * todos dentro de uma única transação.
   * Útil para sincronização global onde muitos registros precisam
   * ser persistidos de uma vez, evitando N transações individuais.
   */
  async saveMany(
    inputs: Array<{ order: UpsertSalesOrderInput; items: UpsertSalesOrderItemInput[] }>
  ): Promise<number> {
    const result = await this.prisma.$transaction(async (tx) => {
      let count = 0;
      for (const { order, items } of inputs) {
        const saved = await tx.salesOrder.upsert({
          where: { omieId: order.omieId },
          create: { ...order },
          update: { ...order, lastSyncAt: new Date() },
        });

        for (const item of items) {
          await tx.salesOrderItem.upsert({
            where: { omieItemId: item.omieItemId },
            create: { ...item, salesOrderId: saved.id },
            update: { ...item, salesOrderId: saved.id, lastSyncAt: new Date() },
          });
        }

        count += 1;
      }
      return count;
    });

    return result;
  }
}