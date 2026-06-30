// ---------------------------------------------------------------------------
// Route — Get Production Order Sync State (Read-Model)
// ---------------------------------------------------------------------------
// GET /v1/integration/production-orders/read/sync-state
// Retorna o estado atual da sincronização de ordens de produção:
// última sync, status da fila, total de OPs no read-model.
//
// C3: Endpoint para monitoramento do estado de sync.
// ---------------------------------------------------------------------------

import type { FastifyInstance } from "fastify";
import { prisma } from "@/shared/db/prisma";

export async function registerGetSyncStateRoute(
    app: FastifyInstance
) {
    app.get(
        "/v1/integration/production-orders/read/sync-state",
        async (request, reply) => {
            try {
                const [syncState, totalCounts, queueCounts] = await Promise.all([
                    prisma.productionOrderSyncState.findFirst({
                        where: { id: "GLOBAL" },
                    }),
                    Promise.all([
                        prisma.productionOrderReadModel.count(),
                        prisma.productionOrderReadModel.count({ where: { isOpen: true } }),
                        prisma.productionOrderReadModel.count({ where: { isOpen: false } }),
                        prisma.productionOrderReadModel.count({ where: { isLate: true } }),
                        prisma.productionOrderReadModel.count({ where: { hasStockIssue: true } }),
                    ]),
                    prisma.productionOrderCommand.groupBy({
                        by: ["status"],
                        _count: true,
                    }),
                ]);

                const queueMap: Record<string, number> = {};
                for (const item of queueCounts) {
                    queueMap[item.status.toLowerCase()] = item._count;
                }

                return reply.code(200).send({
                    success: true,
                    data: {
                        syncState: syncState
                            ? {
                                id: syncState.id,
                                lastSyncAt: syncState.lastSyncAt,
                                updatedAt: syncState.updatedAt,
                            }
                            : null,
                        readModel: {
                            total: totalCounts[0],
                            open: totalCounts[1],
                            closed: totalCounts[2],
                            late: totalCounts[3],
                            withStockIssues: totalCounts[4],
                        },
                        queue: {
                            pending: queueMap.pending ?? 0,
                            processing: queueMap.processing ?? 0,
                            confirmed: queueMap.confirmed ?? 0,
                            failed: queueMap.failed ?? 0,
                            accepted: queueMap.accepted ?? 0,
                        },
                    },
                });
            } catch (error) {
                console.error("[READ-MODEL][SYNC-STATE][ERROR]", error);
                return reply.code(500).send({
                    success: false,
                    error: "INTERNAL_ERROR",
                    message: "An unexpected error occurred",
                });
            }
        }
    );
}
