import type { FastifyInstance } from "fastify";
import { env } from "@/config";

import { OmieCustomerStore } from "../../../../infrastructure/db";
import { fakeOmieCustomerStore } from "../../../../infrastructure/db/fake-stores.singletons";

export async function registerGetCustomerStatsRoute(
    app: FastifyInstance
) {
    const store = env.CUSTOMER_SYNC_GATEWAY === "fake"
        ? fakeOmieCustomerStore
        : new OmieCustomerStore();

    app.get("/v1/admin/read/customers/stats", async (_request, reply) => {
        const data = await store.getStats();

        return reply.send({
            success: true,
            data,
        });
    });
}
