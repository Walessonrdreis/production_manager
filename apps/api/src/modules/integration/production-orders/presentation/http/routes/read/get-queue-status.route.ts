// ---------------------------------------------------------------------------
// Route — Get Queue Status (Read-Model)
// ---------------------------------------------------------------------------
// GET /v1/integration/production-orders/read/queue
// Retorna status atual da fila de comandos (command queue).
// ---------------------------------------------------------------------------

import type { FastifyInstance } from "fastify";

import { prisma } from "@/shared/db/prisma";
import { ProductionOrderCommandStore } from "../../../../infrastructure/db/production-order-command.store";

export async function registerGetQueueStatusRoute(app: FastifyInstance) {
    app.get(
        "/v1/integration/production-orders/read/queue",
        async (request, reply) => {
            try {
                const commandStore = new ProductionOrderCommandStore(prisma);

                const [counts, recent] = await Promise.all([
                    commandStore.countByStatusAll(),
                    commandStore.listRecent(10),
                ]);

                return reply.code(200).send({
                    success: true,
                    data: {
                        counts,
                        recent: recent.map((cmd) => ({
                            id: cmd.id,
                            externalRequestId: cmd.externalRequestId,
                            commandType: cmd.commandType,
                            status: cmd.status,
                            source: cmd.source,
                            createdAt: cmd.createdAt.toISOString(),
                            updatedAt: cmd.updatedAt.toISOString(),
                        })),
                    },
                });
            } catch (error) {
                console.error("[OP][QUEUE][STATUS][ERROR]", error);
                return reply.code(500).send({
                    success: false,
                    error: "INTERNAL_ERROR",
                    message: "An unexpected error occurred",
                });
            }
        }
    );
}
