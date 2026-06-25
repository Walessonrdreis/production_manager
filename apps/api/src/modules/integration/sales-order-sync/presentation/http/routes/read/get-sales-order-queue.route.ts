// ---------------------------------------------------------------------------
// Queue Status — Sales Order Sync
// ---------------------------------------------------------------------------
// Lista comandos pendentes/em processamento na fila.
// Útil para diagnóstico e monitoramento.
// ---------------------------------------------------------------------------

import type { FastifyInstance } from "fastify";
import { prisma } from "@/shared/db/prisma";
import { SalesOrderSyncCommandStore } from "../../../../infrastructure/db/sales-order-sync-command.store";

export async function registerGetSalesOrderQueueRoute(
    app: FastifyInstance
) {
    const commandStore = new SalesOrderSyncCommandStore(prisma);

    app.get(
        "/v1/integration/sales-order-sync/read/queue",
        async (request, reply) => {
            const { limit, offset } = request.query as {
                limit?: number;
                offset?: number;
            };

            const items = await commandStore.listByStatus("ACCEPTED", {
                limit: limit ? Number(limit) : 50,
                offset: offset ? Number(offset) : 0,
            });

            const total = await commandStore.countByStatus("ACCEPTED");

            return reply.send({
                success: true,
                data: items.map((item) => ({
                    externalRequestId: item.externalRequestId,
                    status: item.status,
                    resourceId: item.resourceId,
                    source: item.source,
                    createdAt: item.createdAt,
                    updatedAt: item.updatedAt,
                })),
                meta: { total, limit: limit ?? 50, offset: offset ?? 0 },
            });
        }
    );
}
