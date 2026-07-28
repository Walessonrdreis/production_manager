// ---------------------------------------------------------------------------
// Route — Get Queue Failures (Read-Model)
// ---------------------------------------------------------------------------
// GET /v1/integration/production-orders/read/queue/failures
// Retorna os comandos com falha mais recentes.
// ---------------------------------------------------------------------------

import type { FastifyInstance } from "fastify";

import { prisma } from "@/shared/db/prisma";
import { ProductionOrderCommandStore } from "../../../../infrastructure/db/production-order-command.store";

export async function registerGetQueueFailuresRoute(app: FastifyInstance) {
    app.get(
        "/v1/integration/production-orders/read/queue/failures",
        async (request, reply) => {
            try {
                const commandStore = new ProductionOrderCommandStore(prisma);
                const failures = await commandStore.listFailures(20);

                return reply.code(200).send({
                    success: true,
                    data: failures.map((cmd) => ({
                        id: cmd.id,
                        externalRequestId: cmd.externalRequestId,
                        commandType: cmd.commandType,
                        source: cmd.source,
                        lastError: cmd.lastError,
                        retryCount: cmd.retryCount,
                        createdAt: cmd.createdAt.toISOString(),
                        updatedAt: cmd.updatedAt.toISOString(),
                    })),
                });
            } catch (error) {
                console.error("[OP][QUEUE][FAILURES][ERROR]", error);
                return reply.code(500).send({
                    success: false,
                    error: "INTERNAL_ERROR",
                    message: "An unexpected error occurred",
                });
            }
        }
    );
}
