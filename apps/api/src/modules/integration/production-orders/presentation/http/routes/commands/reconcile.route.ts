// ---------------------------------------------------------------------------
// Route — Reconcile Production Orders (Command)
// ---------------------------------------------------------------------------
// POST /v1/integration/production-orders/commands/reconcile
// Enfileira reconciliação: verifica se OPs no Omie correspondem ao read-model
// e corrige divergências. Opcionalmente aceita omieId para OP específica.
//
// C3: Comando para consistência entre Omie e read-model.
// ---------------------------------------------------------------------------

import type { FastifyInstance } from "fastify";
import { getLogger } from "@/shared/logger";
import { prisma } from "@/shared/db/prisma";
import { enqueueJob } from "@/shared/infra/job-queue";
import { ProductionOrderCommandStore } from "../../../../infrastructure/db/production-order-command.store";
import type {
    ReconcileRequestDTO,
    ReconcileResponseDTO,
} from "../../../../application/dto/reconcile.dto";

const logger = getLogger("reconcile.route");

export async function registerReconcileRoute(app: FastifyInstance) {
    app.post("/v1/integration/production-orders/commands/reconcile", async (request, reply) => {
        try {
            const body = (request.body as ReconcileRequestDTO) ?? {};

            const externalRequestId =
                body.externalRequestId ?? `production-orders-reconcile-${Date.now()}`;

            const commandStore = new ProductionOrderCommandStore(prisma);

            // ─── Registra comando ────────────────────────────────────
            const { record, created } = await commandStore.enqueue({
                externalRequestId,
                commandType: "RECONCILE",
                payload: body.omieId ? { omieId: body.omieId } : undefined,
                source: "API2",
            });

            if (!created) {
                return reply.code(409).send({
                    success: false,
                    error: "ALREADY_EXISTS",
                    message: `Command ${externalRequestId} already exists with status ${record.status}`,
                });
            }

            // ─── Enfileira no PgBoss ────────────────────────────────
            await enqueueJob("production-order.reconcile", {
                externalRequestId,
                omieId: body.omieId,
            }, {
                retryLimit: 2,
                retryBackoff: true,
                singletonKey: externalRequestId,
            });

            logger.info("Reconcile enqueued", { externalRequestId, omieId: body.omieId });

            const response: ReconcileResponseDTO = {
                status: "ACCEPTED",
                externalRequestId,
                resourceId: body.omieId ?? "__ALL__",
            };

            return reply.code(202).send({
                success: true,
                data: response,
            });
        } catch (error) {
            logger.error("[RECONCILE][ERROR]", error as any);
            return reply.code(500).send({
                success: false,
                error: "INTERNAL_ERROR",
                message: "An unexpected error occurred",
            });
        }
    });
}
