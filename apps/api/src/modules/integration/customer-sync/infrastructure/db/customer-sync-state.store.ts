import { prisma } from "@/shared/db/prisma";

export class CustomerSyncStateStore {
    async getState() {
        return prisma.customerSyncState.upsert({
            where: { id: "global" },
            update: {},
            create: {
                id: "global",
                lastSyncAt: new Date("2000-01-01"),
            },
        });
    }

    async updateLastSync(date: Date) {
        return prisma.customerSyncState.update({
            where: { id: "global" },
            data: { lastSyncAt: date },
        });
    }
}
