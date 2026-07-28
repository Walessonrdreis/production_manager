// ---------------------------------------------------------------------------
// Route — Retry Failed Commands (Command)
// ---------------------------------------------------------------------------
// POST /v1/integration/production-orders/commands/retry-failed
// Re-enfileira comandos FAILED como PENDING para nova tentativa.
// Opcionalmente aceita externalRequestId para retentar um comando específico.
//
// C1-P0: Comando para recuperação de falhas na fila.
// ---------------------------------------------------------------------------

import type { FastifyInstance } from "fastify";
import { getLogger } from "@/shared/logger";
import { prisma } from "@/shared/db/prisma";
import { ProductionOrderCommandStore } from "../../../../infrastructure/db/production-order-command.store";
import type {
    RetryFailedRequestDTO,
    RetryFailedResponseDTO,
} from "../../../../application/dto/retry-failed.dto";

const logger = getLogger("retry-failed.route");

export async function registerRetryFailedRoute(app: FastifyInstance) {
    app.post("/v1/integration/production-orders/commands/retry-failed", async (request, reply) => {
        try {
            const body = (request.body as RetryFailedRequestDTO) ?? {};
            const limit = Math.min(200, Math.max(1, body.limit ?? 50));
            const commandStore = new ProductionOrderCommandStore(prisma);

            const totalFailedBefore = await commandStore.countFailed();

            let commandsToRetry: Array<{ externalRequestId: string }>;

            if (body.externalRequestId) {
                // ─── Retentar comando específico ──────────────────────
                const cmd = await commandStore.findByExternalRequestId(body.externalRequestId);
                if (!cmd) {
                    return reply.code(404).send({
                        success: false,
                        error: "NOT_FOUND",
                        message: `Command ${body.externalRequestId} not found`,
                    });
                }
                if (cmd.status !== "FAILED") {
                    return reply.code(400).send({
                        success: false,
                        error: "INVALID_STATUS",
                        message: `Command ${body.externalRequestId} has status ${cmd.status}, expected FAILED`,
                    });
                }
                commandsToRetry = [{ externalRequestId: cmd.externalRequestId }];
            } else {
                // ─── Retentar todos os FAILED ─────────────────────────
                const failed = await commandStore.listFailures(limit);
                commandsToRetry = failed.map((c) => ({ externalRequestId: c.externalRequestId }));
            }

            // ─── Re-enfileirar ────────────────────────────────────────
            const retried: string[] = [];
            for (const cmd of commandsToRetry) {
                try {
                    await commandStore.resetToPending(cmd.externalRequestId);
                    retried.push(cmd.externalRequestId);
                } catch (error) {
                    logger.error("Failed to retry command", {
                        externalRequestId: cmd.externalRequestId,
                        error: error instanceof Error ? error.message : String(error),
                    });
                }
            }

            const response: RetryFailedResponseDTO = {
                retried: retried.length,
                totalFailedBefore,
                externalRequestIds: retried,
            };

            return reply.code(200).send({
                success: true,
                data: response,
            });
        } catch (error) {
            logger.error("[RETRY-FAILED][ERROR]", error as any);
            return reply.code(500).send({
                success: false,
                error: "INTERNAL_ERROR",
                message: "An unexpected error occurred",
            });
        }
    });
}
