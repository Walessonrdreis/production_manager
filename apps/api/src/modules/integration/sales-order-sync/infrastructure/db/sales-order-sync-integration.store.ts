import type { PrismaClient, SalesOrder, SalesOrderItem } from "@prisma/client";

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
  constructor(private readonly prisma: PrismaClient) {}

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
}