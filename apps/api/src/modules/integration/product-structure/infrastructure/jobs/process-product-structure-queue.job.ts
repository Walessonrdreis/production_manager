// ---------------------------------------------------------------------------
// Job — Process Product Structure Command Queue
// ---------------------------------------------------------------------------
// Consome a fila de comandos PENDING e executa contra o Omie.
//
// Fluxo:
//   1. Adquire lock (evita concorrência entre workers)
//   2. DEQUEUE 1 comando PENDING → PROCESSING (SKIP LOCKED)
//   3. Dispara gateway conforme commandType (SYNC | APPLY | DELETE | SYNC_GLOBAL)
//   4. Sucesso → markConfirmed / Falha → markFailed
//   5. Sleep 1s (rate limit)
//   6. Repete até fila vazia
//   7. Release lock
// ---------------------------------------------------------------------------

import { getLogger } from "@/shared/logger";
import { prisma } from "@/shared/db/prisma";
import { env } from "@/config";
import { createJobLock } from "@/shared/utils/job-lock";
import { PrismaSyncStateStore } from "@/shared/integration/strategies/sync-state.store";
import {
    createOmieClientWithCircuitBreaker,
    type OmieClientWithCircuitBreaker,
} from "@/shared/integrations/omie/omie-client-with-circuit-breaker";
import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";

import { ProductStructureCommandStore } from "@/modules/integration/product-structure/infrastructure/db/product-structure-command.store";
import { ProductStructureIntegrationStore } from "@/modules/integration/product-structure/infrastructure/db/product-structure-integration.store";

import { FakeProductStructureFetchGateway } from "@/modules/integration/product-structure/infrastructure/gateways/fetch/fake-product-structure-fetch.gateway";
import { RealProductStructureFetchGateway } from "@/modules/integration/product-structure/infrastructure/gateways/fetch/real-product-structure-fetch.gateway";
import type { ProductStructureFetchGateway } from "@/modules/integration/product-structure/application/ports/product-structure-fetch.gateway";

import { FakeProductStructureApplyGateway } from "@/modules/integration/product-structure/infrastructure/gateways/apply/fake-product-structure-apply.gateway";
import { RealProductStructureApplyGateway } from "@/modules/integration/product-structure/infrastructure/gateways/apply/real-product-structure-apply.gateway";
import type { ProductStructureApplyGateway, ApplyProductStructureItem } from "@/modules/integration/product-structure/application/ports/product-structure-apply.gateway";

import { FakeProductStructureDeleteGateway } from "@/modules/integration/product-structure/infrastructure/gateways/delete/fake-product-structure-delete.gateway";
import { RealProductStructureDeleteGateway } from "@/modules/integration/product-structure/infrastructure/gateways/delete/real-product-structure-delete.gateway";
import type { ProductStructureDeleteGateway } from "@/modules/integration/product-structure/application/ports/product-structure-delete.gateway";

import { FakeProductStructureFetchPageGateway } from "@/modules/integration/product-structure/infrastructure/gateways/fetch-page/fake-product-structure-fetch-page.gateway";
import { RealProductStructureFetchPageGateway } from "@/modules/integration/product-structure/infrastructure/gateways/fetch-page/real-product-structure-fetch-page.gateway";
import type { ProductStructureFetchPageGateway } from "@/modules/integration/product-structure/application/ports/product-structure-fetch-page.gateway";

import { executeSyncAllProductStructures } from "@/modules/integration/product-structure/application/use-cases/sync-all-product-structures.usecase";

const LOCK_KEY = "product-structure-queue-processor";
const LOCK_TTL_MS = 60_000; // 1 minuto de lock
const RATE_LIMIT_MS = 1_000; // 1 segundo entre chamadas Omie
const BATCH_SIZE = 1; // processa 1 por vez

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

export class ProcessProductStructureQueueJob {
    static async execute(): Promise<void> {
        const logger = getLogger("product-structure:queue-processor");
        const lock = createJobLock(prisma);

        const result = await lock.runExclusive(LOCK_KEY, LOCK_TTL_MS, async (ctx) => {
            const commandStore = new ProductStructureCommandStore(prisma);

            const renewal = setInterval(async () => {
                try {
                    await ctx.renew();
                } catch {
                    // Se falhou renovar, sai do loop
                }
            }, LOCK_TTL_MS / 2);

            try {
                const isFake = env.PRODUCT_STRUCTURE_GATEWAY === "fake";
                const omieClient: OmieHttpClientPort = getOmieClient();

                // Gateways — escolha real/fake baseada no env
                const fetchGateway: ProductStructureFetchGateway = isFake
                    ? new FakeProductStructureFetchGateway()
                    : new RealProductStructureFetchGateway(omieClient);

                const applyGateway: ProductStructureApplyGateway = isFake
                    ? new FakeProductStructureApplyGateway()
                    : new RealProductStructureApplyGateway(omieClient);

                const deleteGateway: ProductStructureDeleteGateway = isFake
                    ? new FakeProductStructureDeleteGateway()
                    : new RealProductStructureDeleteGateway(omieClient);

                const fetchPageGateway: ProductStructureFetchPageGateway = isFake
                    ? new FakeProductStructureFetchPageGateway()
                    : new RealProductStructureFetchPageGateway(omieClient);

                const integrationStore = new ProductStructureIntegrationStore(prisma);

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
                        productCode: command.productCode,
                    });

                    try {
                        // 2) Executa o comando de acordo com o tipo
                        await executeCommand(
                            command,
                            fetchGateway,
                            applyGateway,
                            deleteGateway,
                            fetchPageGateway,
                            integrationStore,
                            commandStore,
                            logger
                        );

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
        productCode: string;
        payload: Record<string, unknown> | null;
    },
    fetchGateway: ProductStructureFetchGateway,
    applyGateway: ProductStructureApplyGateway,
    deleteGateway: ProductStructureDeleteGateway,
    fetchPageGateway: ProductStructureFetchPageGateway,
    integrationStore: ProductStructureIntegrationStore,
    commandStore: ProductStructureCommandStore,
    _logger: ReturnType<typeof getLogger>
): Promise<void> {
    const { externalRequestId, productCode } = command;
    const payload = command.payload ?? {};

    switch (command.commandType) {
        case "SYNC": {
            const result = await fetchGateway.fetchByProductCode(productCode);
            await integrationStore.save(result);
            await commandStore.markConfirmed(externalRequestId);
            return;
        }

        case "APPLY": {
            const items = (payload.items as ApplyProductStructureItem[]) ?? [];

            await applyGateway.apply(productCode, items);

            // Pós-apply: sincroniza espelho local
            const result = await fetchGateway.fetchByProductCode(productCode);
            await integrationStore.save(result);

            await commandStore.markConfirmed(externalRequestId);
            return;
        }

        case "DELETE": {
            await deleteGateway.delete(productCode);

            // Pós-delete: atualiza espelho
            const result = await fetchGateway.fetchByProductCode(productCode);
            await integrationStore.save(result);

            await commandStore.markConfirmed(externalRequestId);
            return;
        }

        case "SYNC_GLOBAL": {
            const syncStateStore = new PrismaSyncStateStore(
                prisma.productStructureSyncState,
                "GLOBAL"
            );

            await executeSyncAllProductStructures(
                fetchPageGateway,
                integrationStore,
                commandStore,
                syncStateStore,
                {
                    externalRequestId,
                    pageSize: Number(payload.pageSize ?? 100),
                    maxPages: Number(payload.maxPages ?? 1000),
                    source: "JOB",
                }
            );
            return;
        }

        default:
            throw new Error(`Unknown command type: ${command.commandType}`);
    }
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
