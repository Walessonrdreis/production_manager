import type { FastifyInstance } from "fastify";
import { env } from "@/config";

import { prisma } from "@/shared/db/prisma";
import { fakeCustomerCommandStore } from "../../../../infrastructure/db/fake-stores.singletons";

export async function registerGetCustomerLastSyncRoute(
    app: FastifyInstance
) {
    app.get(
        "/v1/integration/customer-sync/read/last-sync",
        async (_request, reply) => {
            if (env.CUSTOMER_SYNC_GATEWAY === "fake") {
                const all = await fakeCustomerCommandStore.listRecent(1);
                const data = all[0] ?? null;
                if (!data) {
                    return reply.code(404).send({
                        success: false,
                        error: {
                            code: "NOT_FOUND",
                            message: "Nenhum sync global encontrado",
                        },
                    });
                }
                return reply.send({ success: true, data });
            }

            const data = await prisma.customerCommand.findFirst({
                where: {
                    customerCode: "__GLOBAL__",
                },
                orderBy: { createdAt: "desc" },
            });

            if (!data) {
                return reply.code(404).send({
                    success: false,
                    error: {
                        code: "NOT_FOUND",
                        message: "Nenhum sync global encontrado",
                    },
                });
            }

            return reply.send({
                success: true,
                data,
            });
        }
    );
}
