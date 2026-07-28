import type { FastifyInstance } from "fastify";
import { env } from "@/config";

import { CustomerCommandStore } from "../../../../infrastructure/db";
import { fakeCustomerCommandStore } from "../../../../infrastructure/db/fake-stores.singletons";
import { parseNumber } from "../../../../application/utils/query.utils";

export async function registerGetCustomerSyncFailuresRoute(
    app: FastifyInstance
) {
    const store = env.CUSTOMER_SYNC_GATEWAY === "fake"
        ? fakeCustomerCommandStore
        : new CustomerCommandStore();

    app.get(
        "/v1/integration/customer-sync/read/sync-failures",
        async (request, reply) => {
            const query = request.query as Record<string, unknown>;
            const limit = parseNumber(query.limit, 20);

            const data = await store.listFailures(limit);

            return reply.send({
                success: true,
                data,
            });
        }
    );
}
