// ---------------------------------------------------------------------------
// Route — Rebuild Production Order Read-Model (Command)
// ---------------------------------------------------------------------------
// POST /v1/integration/production-orders/commands/rebuild
// Disparar rebuild completo: sync global + refresh do read model.
// Equivalente a sync-all seguido de refresh, mas num comando só.
//
// C3: Comando para reconstrução completa do read-model.
// ---------------------------------------------------------------------------

import type { FastifyInstance } from "fastify";
import { getLogger } from "@/shared/logger";
import { enqueueJob } from "@/shared/infra/job-queue";

const logger = getLogger("rebuild.route");

export async function registerRebuildRoute(app: FastifyInstance) {
    app.post("/v1/integration/production-orders/commands/rebuild", async (request, reply) => {
        try {
            const body = (request.body ?? {}) as {
                externalRequestId?: string;
                pageSize?: number;
                maxPages?: number;
            };

            const externalRequestId =
                body.externalRequestId ?? `production-orders-rebuild-${Date.now()}`;

            // ─── Enfileira sync global ──────────────────────────────
            // O handler production-order.sync-global já orquestra o
            // refresh do read-model ao final via SyncHooksRunner.
            await enqueueJob("production-order.sync-global", {
                externalRequestId,
                pageSize: body.pageSize ?? 100,
                maxPages: body.maxPages ?? 999999,
                syncItems: true,
            }, {
                retryLimit: 2,
                retryBackoff: true,
                singletonKey: `production-order-rebuild-${externalRequestId}`,
            });

            logger.info("Rebuild enqueued", { externalRequestId });

            return reply.code(202).send({
                success: true,
                data: {
                    status: "ACCEPTED",
                    externalRequestId,
                    resourceId: "__REBUILD__",
                },
            });
        } catch (error) {
            logger.error("[REBUILD][ERROR]", error as any);
            return reply.code(500).send({
                success: false,
                error: "INTERNAL_ERROR",
                message: "An unexpected error occurred",
            });
        }
    });
}
