// ---------------------------------------------------------------------------
// Job — Process Production Order Command Queue
// ---------------------------------------------------------------------------
// Consome a fila de comandos PENDING e executa contra o Omie.
//
// Fluxo:
//   1. Adquire lock (evita concorrência entre workers)
//   2. DEQUEUE 1 comando PENDING → PROCESSING (SKIP LOCKED)
//   3. Dispara gateway (CREATE_OP → IncluirOrdemProducao)
//   4. Sucesso → markConfirmed / Falha → markFailed
//   5. Sleep 1s (rate limit)
//   6. Repete até fila vazia
//   7. Release lock
// ---------------------------------------------------------------------------

import { getLogger } from "@/shared/logger";
import { prisma } from "@/shared/db/prisma";
import { env } from "@/config";
import { createJobLock } from "@/shared/utils/job-lock";
import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";
import {
    createOmieClientWithCircuitBreaker,
    type OmieClientWithCircuitBreaker,
} from "@/shared/integrations/omie/omie-client-with-circuit-breaker";

import { ProductionOrderCommandStore } from "@/modules/integration/production-orders/infrastructure/db/production-order-command.store";
import { ProductionOrderSyncStore } from "@/modules/integration/production-orders/infrastructure/db/production-order-sync.store";
import type { ProductionOrderCreationGateway } from "@/modules/integration/production-orders/infrastructure/gateways/creation/production-order-creation.gateway";
import { RealProductionOrderCreationGateway } from "@/modules/integration/production-orders/infrastructure/gateways/creation/real-production-order-creation.gateway";
import { FakeProductionOrderCreationGateway } from "@/modules/integration/production-orders/infrastructure/gateways/creation/fake-production-order-creation.gateway";

import type { ProductionOrderUpdateGateway } from "@/modules/integration/production-orders/infrastructure/gateways/update/production-order-update.gateway";
import { RealProductionOrderUpdateGateway } from "@/modules/integration/production-orders/infrastructure/gateways/update/real-production-order-update.gateway";
import { FakeProductionOrderUpdateGateway } from "@/modules/integration/production-orders/infrastructure/gateways/update/fake-production-order-update.gateway";

import type { ProductionOrderCancelGateway } from "@/modules/integration/production-orders/infrastructure/gateways/cancel/production-order-cancel.gateway";
import { RealProductionOrderCancelGateway } from "@/modules/integration/production-orders/infrastructure/gateways/cancel/real-production-order-cancel.gateway";
import { FakeProductionOrderCancelGateway } from "@/modules/integration/production-orders/infrastructure/gateways/cancel/fake-production-order-cancel.gateway";

import type { ProductionOrderChangeStageGateway } from "@/modules/integration/production-orders/infrastructure/gateways/change-stage/production-order-change-stage.gateway";
import { RealProductionOrderChangeStageGateway } from "@/modules/integration/production-orders/infrastructure/gateways/change-stage/real-production-order-change-stage.gateway";
import { FakeProductionOrderChangeStageGateway } from "@/modules/integration/production-orders/infrastructure/gateways/change-stage/fake-production-order-change-stage.gateway";

const LOCK_KEY = "production-order-queue-processor";
const LOCK_TTL_MS = 60_000; // 1 minuto de lock
const RATE_LIMIT_MS = 1_000; // 1 segundo entre chamadas Omie
const BATCH_SIZE = 1; // processa 1 por vez

// Cache do cliente Omie (singleton)
let omieClientSingleton: OmieClientWithCircuitBreaker | null = null;

function getOmieClient(): OmieClientWithCircuitBreaker {
    if (omieClientSingleton) return omieClientSingleton;

    omieClientSingleton = createOmieClientWithCircuitBreaker({
        baseUrl: env.OMIE_BASE_URL,
        appKey: env.OMIE_APP_KEY,
        appSecret: env.OMIE_APP_SECRET,
        timeoutMs: 10000,
        retry: { attempts: 2, baseDelayMs: 1000, maxDelayMs: 3000 },
        debug: process.env.NODE_ENV !== "production",
        circuitBreaker: {
            failureThreshold: 3,
            resetTimeoutMs: 30000,
            successThreshold: 2,
        },
    });

    return omieClientSingleton;
}

export class ProcessProductionOrderQueueJob {
    static async execute(): Promise<void> {
        const logger = getLogger("production-orders:queue-processor");
        const lock = createJobLock(prisma);

        const result = await lock.runExclusive(LOCK_KEY, LOCK_TTL_MS, async (ctx) => {
            const commandStore = new ProductionOrderCommandStore(prisma);

            // Renova o lock a cada iteração
            const renewal = setInterval(async () => {
                try {
                    await ctx.renew();
                } catch {
                    // Se falhou renovar, sai do loop
                }
            }, LOCK_TTL_MS / 2);

            try {
                const isFake = env.PRODUCTION_ORDER_GATEWAY === "fake";
                const omieClient = getOmieClient();

                const creationGateway: ProductionOrderCreationGateway = isFake
                    ? new FakeProductionOrderCreationGateway()
                    : new RealProductionOrderCreationGateway(omieClient);

                const updateGateway: ProductionOrderUpdateGateway = isFake
                    ? new FakeProductionOrderUpdateGateway()
                    : new RealProductionOrderUpdateGateway(omieClient);

                const cancelGateway: ProductionOrderCancelGateway = isFake
                    ? new FakeProductionOrderCancelGateway()
                    : new RealProductionOrderCancelGateway(omieClient);

                const changeStageGateway: ProductionOrderChangeStageGateway = isFake
                    ? new FakeProductionOrderChangeStageGateway()
                    : new RealProductionOrderChangeStageGateway(omieClient);

                let processedCount = 0;

                while (true) {
                    // 1) DEQUEUE 1 comando PENDING → PROCESSING
                    const commands = await commandStore.dequeue(BATCH_SIZE);

                    if (commands.length === 0) {
                        logger.info("Queue empty, processed", { processedCount });
                        break;
                    }

                    const command = commands[0];
                    logger.info("Processing command", {
                        id: command.id,
                        externalRequestId: command.externalRequestId,
                        commandType: command.commandType,
                    });

                    try {
                        // 2) Executa o comando de acordo com o tipo
                        await executeCommand(command, creationGateway, updateGateway, cancelGateway, changeStageGateway, commandStore, logger);

                        processedCount++;
                    } catch (error: unknown) {
                        const msg = error instanceof Error ? error.message : String(error);
                        logger.error("Command processing failed", {
                            externalRequestId: command.externalRequestId,
                            error: msg,
                        });

                        await commandStore.markFailed(command.externalRequestId, error);
                    }

                    // 3) Rate limit: 1 segundo entre chamadas Omie
                    await sleep(RATE_LIMIT_MS);
                }

                return { processed: processedCount };
            } finally {
                clearInterval(renewal);
            }
        });

        if (!result.acquired) {
            logger.info("Could not acquire lock, another instance is processing the queue");
        } else {
            logger.info("Queue processing finished", { processed: result.result.processed });
        }
    }
}

/**
 * Executa um comando específico baseado no commandType.
 */
async function executeCommand(
    command: {
        externalRequestId: string;
        commandType: string;
        payload: Record<string, unknown> | null;
    },
    creationGateway: ProductionOrderCreationGateway,
    updateGateway: ProductionOrderUpdateGateway,
    cancelGateway: ProductionOrderCancelGateway,
    changeStageGateway: ProductionOrderChangeStageGateway,
    _commandStore: ProductionOrderCommandStore,
    _logger: ReturnType<typeof getLogger>
): Promise<void> {
    switch (command.commandType) {
        case "CREATE_OP": {
            const payload = command.payload ?? {};
            const request = {
                externalRequestId: command.externalRequestId,
                productId: String(payload.productId ?? ""),
                quantity: Number(payload.quantity ?? 0),
                scheduledDate: payload.scheduledDate
                    ? String(payload.scheduledDate)
                    : undefined,
                notes: payload.notes ? String(payload.notes) : undefined,
            };

            const gatewayResult = await creationGateway.createProductionOrder(request);

            if (gatewayResult.status === "FAILED") {
                throw new Error(`Omie rejeitou a criação da OP: ${command.externalRequestId}`);
            }

            return;
        }

        case "UPDATE_OP": {
            const payload = command.payload ?? {};

            const gatewayResult = await updateGateway.updateProductionOrder({
                externalRequestId: command.externalRequestId,
                omieCode: String(payload.omieCode ?? ""),
                quantity: payload.quantity ? Number(payload.quantity) : undefined,
                forecastDate: payload.forecastDate
                    ? String(payload.forecastDate)
                    : undefined,
                notes: payload.notes ? String(payload.notes) : undefined,
            });

            if (gatewayResult.status === "FAILED") {
                throw new Error(`Omie rejeitou a atualização da OP: ${command.externalRequestId}`);
            }

            return;
        }

        case "CANCEL_OP": {
            const payload = command.payload ?? {};

            const gatewayResult = await cancelGateway.cancelProductionOrder({
                externalRequestId: command.externalRequestId,
                omieCode: String(payload.omieCode ?? ""),
                reason: payload.reason ? String(payload.reason) : undefined,
            });

            if (gatewayResult.status === "FAILED") {
                throw new Error(`Omie rejeitou o cancelamento da OP: ${command.externalRequestId}`);
            }

            return;
        }

        case "CHANGE_STAGE": {
            const payload = command.payload ?? {};

            const gatewayResult = await changeStageGateway.changeStage({
                externalRequestId: command.externalRequestId,
                omieCode: String(payload.omieCode ?? ""),
                stage: String(payload.stage ?? ""),
            });

            if (gatewayResult.status === "FAILED") {
                throw new Error(`Omie rejeitou a alteração de etapa da OP: ${command.externalRequestId}`);
            }

            return;
        }

        case "SYNC_OP": {
            const syncLogger = getLogger("production-orders:queue:sync-op");
            syncLogger.warn("SYNC_OP should use refresh route instead of queue");
            // SYNC_OP é tratado pela rota síncrona .../refresh
            // Se chegou aqui, ignora silenciosamente
            return;
        }

        case "SYNC_GLOBAL":
            throw new Error("SYNC_GLOBAL should not be in the queue; use the sync job instead");

        default:
            throw new Error(`Unknown command type: ${command.commandType}`);
    }
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
