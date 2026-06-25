import type { FastifyInstance } from "fastify";
import { env } from "@/config";

import { CustomerCommandStore } from "../../../../infrastructure/db";
import { fakeCustomerCommandStore } from "../../../../infrastructure/db/fake-stores.singletons";

export async function registerGetCustomerSyncStatusRoute(
    app: FastifyInstance
) {
    app.get(
        "/v1/integration/customer-sync/commands/:externalRequestId",
        async (request, reply) => {
            const { externalRequestId } = request.params as {
                externalRequestId: string;
            };

            const store = env.CUSTOMER_SYNC_GATEWAY === "fake"
                ? fakeCustomerCommandStore
                : new CustomerCommandStore();

            const command = await store.findByExternalRequestId(
                externalRequestId
            );

            if (!command) {
                return reply.code(404).send({
                    success: false,
                    error: {
                        code: "NOT_FOUND",
                        message: "Comando não encontrado",
                    },
                });
            }

            return reply.code(200).send({
                success: true,
                data: {
                    externalRequestId: command.externalRequestId,
                    status: command.status,
                    customerCode: command.customerCode,
                    source: command.source,
                    createdAt: command.createdAt,
                    updatedAt: command.updatedAt,
                    lastError: command.lastError,
                },
            });
        }
    );
}
