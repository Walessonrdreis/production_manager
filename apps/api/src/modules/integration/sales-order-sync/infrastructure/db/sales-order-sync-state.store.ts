import { prisma } from "@/shared/db/prisma";

export class SalesOrderSyncStateStore {
  async getState() {
    return prisma.salesOrderSyncState.upsert({
      where: { id: "GLOBAL" },
      update: {},
      create: {
        id: "GLOBAL",
        lastSyncAt: new Date("2000-01-01"),
      },
    });
  }

  async updateLastSync(date: Date) {
    return prisma.salesOrderSyncState.update({
      where: { id: "GLOBAL" },
      data: {
        lastSyncAt: date,
      },
    });
  }
}