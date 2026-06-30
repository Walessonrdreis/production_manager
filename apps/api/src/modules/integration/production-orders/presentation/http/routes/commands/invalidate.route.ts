// ---------------------------------------------------------------------------
// Route — Invalidate Production Order Read-Model (Command)
// ---------------------------------------------------------------------------
// POST /v1/integration/production-orders/commands/invalidate
// Invalida o read-model de uma OP específica, forçando rebuild
// na próxima consulta.
//
// C3: Comando para marcar read-model como stale.
// ---------------------------------------------------------------------------

import type { FastifyInstance } from "fastify";
import { getLogger } from "@/shared/logger";
import { prisma } from "@/shared/db/prisma";
import { enqueueJob } from "@/shared/infra/job-queue";
import { ProductionOrderCommandStore } from "../../../../infrastructure/db/production-order-command.store";
import type {
    InvalidateRequestDTO,
    InvalidateResponseDTO,
} from "../../../../application/dto/invalidate.dto";

const logger = getLogger("invalidate.route");

export async function registerInvalidateRoute(app: FastifyInstance) {
    app.post("/v1/integration/production-orders/commands/invalidate", async (request, reply) => {
        try {
            const body = (request.body as InvalidateRequestDTO) ?? {};

            if (!body.omieId) {
                return reply.code(400).send({
                    success: false,
                    error: "VALIDATION_ERROR",
                    message: "omieId is required",
                });
            }

            const externalRequestId =
                body.externalRequestId ?? `production-orders-invalidate-${body.omieId}-${Date.now()}`;

            const commandStore = new ProductionOrderCommandStore(prisma);

            // ─── Registra comando ────────────────────────────────────
            const { record, created } = await commandStore.enqueue({
                externalRequestId,
                commandType: "INVALIDATE",
                payload: { omieId: body.omieId },
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
            await enqueueJob("production-order.invalidate", {
                externalRequestId,
                omieId: body.omieId,
            }, {
                retryLimit: 2,
                retryBackoff: true,
                singletonKey: externalRequestId,
            });

            logger.info("Invalidate enqueued", { externalRequestId, omieId: body.omieId });

            const response: InvalidateResponseDTO = {
                status: "ACCEPTED",
                externalRequestId,
                omieId: body.omieId,
            };

            return reply.code(202).send({
                success: true,
                data: response,
            });
        } catch (error) {
            logger.error("[INVALIDATE][ERROR]", error as any);
            return reply.code(500).send({
                success: false,
                error: "INTERNAL_ERROR",
                message: "An unexpected error occurred",
            });
        }
    });
}
