// ---------------------------------------------------------------------------
// Route — Sync Incremental Production Orders (Command)
// ---------------------------------------------------------------------------
// POST /v1/integration/production-orders/commands/sync-incremental
// Enfileira sync incremental: busca apenas OPs alteradas desde a última sync.
// Usa o mesmo worker production-order.sync-global, que já trata updatedSince
// via PrismaSyncStateStore.
//
// C1-P0: Comando para sincronização leve (apenas deltas).
// ---------------------------------------------------------------------------

import type { FastifyInstance } from "fastify";
import { getLogger } from "@/shared/logger";
import { enqueueJob } from "@/shared/infra/job-queue";
import type {
    SyncIncrementalRequestDTO,
    SyncIncrementalResponseDTO,
} from "../../../../application/dto/sync-incremental.dto";

const logger = getLogger("sync-incremental.route");

export async function registerSyncIncrementalRoute(app: FastifyInstance) {
    app.post("/v1/integration/production-orders/commands/sync-incremental", async (request, reply) => {
        try {
            const body = (request.body as SyncIncrementalRequestDTO) ?? {};

            const externalRequestId =
                body.externalRequestId ?? `production-orders-incremental-${Date.now()}`;

            // ─── Enfileira no PgBoss ──────────────────────────────────
            // O handler production-order.sync-global já usa updatedSince
            // a partir do PrismaSyncStateStore, fazendo sync incremental.
            await enqueueJob("production-order.sync-global", {
                externalRequestId,
                pageSize: body.pageSize ?? 100,
                maxPages: body.maxPages ?? 500,
                syncItems: true,
            }, {
                retryLimit: 2,
                retryBackoff: true,
                singletonKey: "production-order-sync-incremental",
            });

            logger.info("Incremental sync enqueued", { externalRequestId });

            const response: SyncIncrementalResponseDTO = {
                status: "ACCEPTED",
                externalRequestId,
                resourceId: "__INCREMENTAL__",
            };

            return reply.code(202).send({
                success: true,
                data: response,
            });
        } catch (error) {
            logger.error("[SYNC-INCREMENTAL][ERROR]", error as any);
            return reply.code(500).send({
                success: false,
                error: "INTERNAL_ERROR",
                message: "An unexpected error occurred",
            });
        }
    });
}
