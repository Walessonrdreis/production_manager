// ---------------------------------------------------------------------------
// Failures — Sales Order Sync
// ---------------------------------------------------------------------------
// Lista comandos que falharam durante a sincronização.
// Útil para diagnóstico, retry manual e monitoramento.
// ---------------------------------------------------------------------------

import type { FastifyInstance } from "fastify";
import { prisma } from "@/shared/db/prisma";
import { SalesOrderSyncCommandStore } from "../../../../infrastructure/db/sales-order-sync-command.store";

export async function registerGetSalesOrderFailuresRoute(
    app: FastifyInstance
) {
    const commandStore = new SalesOrderSyncCommandStore(prisma);

    app.get(
        "/v1/integration/sales-order-sync/read/failures",
        async (request, reply) => {
            const { limit, offset } = request.query as {
                limit?: number;
                offset?: number;
            };

            const items = await commandStore.listByStatus("FAILED", {
                limit: limit ? Number(limit) : 50,
                offset: offset ? Number(offset) : 0,
            });

            const total = await commandStore.countByStatus("FAILED");

            return reply.send({
                success: true,
                data: items.map((item) => ({
                    externalRequestId: item.externalRequestId,
                    status: item.status,
                    resourceId: item.resourceId,
                    source: item.source,
                    lastError: item.lastError,
                    createdAt: item.createdAt,
                    updatedAt: item.updatedAt,
                    completedAt: item.completedAt,
                })),
                meta: { total, limit: limit ?? 50, offset: offset ?? 0 },
            });
        }
    );
}
