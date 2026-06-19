// ---------------------------------------------------------------------------
// DB Store: ProductStockFetchSyncStateStore
// Mantém o estado da última sincronização para sync incremental.
// ---------------------------------------------------------------------------

import { prisma } from "@/shared/db/prisma";

export class ProductStockFetchSyncStateStore {
  async getState() {
    return prisma.productStockFetchSyncState.upsert({
      where: { id: "global" },
      update: {},
      create: {
        id: "global",
        lastSyncAt: new Date("2000-01-01"),
      },
    });
  }

  async updateLastSync(date: Date) {
    return prisma.productStockFetchSyncState.update({
      where: { id: "global" },
      data: { lastSyncAt: date },
    });
  }
}
