// ---------------------------------------------------------------------------
// PgBoss Handlers — Production Orders
// ---------------------------------------------------------------------------
// Registra os handlers PgBoss para processamento assíncrono dos comandos
// de ordem de produção (CREATE_OP, UPDATE_OP, CANCEL_OP, CHANGE_STAGE).
//
// Bridge pura: cria use-cases com gateways injetados e registra handlers
// que delegam para os use-cases.
//
// Deve ser chamado durante o bootstrap, ANTES de `startWorker()`.
// ---------------------------------------------------------------------------

import { prisma } from "@/shared/db/prisma";
import { env } from "@/config";
import { getLogger } from "@/shared/logger";
import { registerJobHandler } from "@/shared/infra/job-queue";
import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";

import { ProductionOrderCommandStore } from "../db/production-order-command.store";
import { ProductionOrderSyncStore } from "../db/production-order-sync.store";

import { ProcessCreateProductionOrderUseCase } from "../../application/use-cases/process-create-production-order.usecase";
import { ProcessUpdateProductionOrderUseCase } from "../../application/use-cases/process-update-production-order.usecase";
import { ProcessCancelProductionOrderUseCase } from "../../application/use-cases/process-cancel-production-order.usecase";
import { ProcessChangeStageProductionOrderUseCase } from "../../application/use-cases/process-change-stage-production-order.usecase";

import { RealProductionOrderCreationGateway } from "../gateways/creation/real-production-order-creation.gateway";
import { FakeProductionOrderCreationGateway } from "../gateways/creation/fake-production-order-creation.gateway";

import { RealProductionOrderUpdateGateway } from "../gateways/update/real-production-order-update.gateway";
import { FakeProductionOrderUpdateGateway } from "../gateways/update/fake-production-order-update.gateway";

import { RealProductionOrderCancelGateway } from "../gateways/cancel/real-production-order-cancel.gateway";
import { FakeProductionOrderCancelGateway } from "../gateways/cancel/fake-production-order-cancel.gateway";

import { RealProductionOrderChangeStageGateway } from "../gateways/change-stage/real-production-order-change-stage.gateway";
import { FakeProductionOrderChangeStageGateway } from "../gateways/change-stage/fake-production-order-change-stage.gateway";

import type { ProcessCreateProductionOrderData } from "../../application/dto/create-production-order.dto";
import type { ProcessUpdateProductionOrderData } from "../../application/dto/update-production-order.dto";
import type { ProcessCancelProductionOrderData } from "../../application/dto/cancel-production-order.dto";
import type { ProcessChangeStageProductionOrderData } from "../../application/dto/change-stage-production-order.dto";

// ── Sync-global ───────────────────────────────────────────────────────

import { executeSyncAllProductionOrders } from "../../application/use-cases/sync-all-production-orders.usecase";
import { SyncProductionOrderItemsUseCase } from "../../application/use-cases/sync-production-order-items.usecase";
import { enqueueJob } from "@/shared/infra/job-queue";
import { PrismaSyncStateStore } from "@/shared/integration/strategies/sync-state.store";
import { SyncHooksRunner } from "@/shared/integration/strategies/sync-hooks";
import { RealProductionOrderSyncPageGateway } from "../gateways/sync-page/real-production-order-sync-page.gateway";
import { FakeProductionOrderSyncPageGateway } from "../gateways/sync-page/fake-production-order-sync-page.gateway";
import { RealProductionOrderConsultGateway } from "../gateways/consult/real-production-order-consult.gateway";

type SyncGlobalJobData = {
    externalRequestId: string;
    pageSize?: number;
    maxPages?: number;
    /** Se true, enfileira sync-items após o sync-global */
    syncItems?: boolean;
};

const logger = getLogger("production-orders:jobs:handler");

function createGateways(omieClient: OmieHttpClientPort) {
    const isFake = env.PRODUCTION_ORDER_GATEWAY === "fake";

    const creationGateway = isFake
        ? new FakeProductionOrderCreationGateway()
        : new RealProductionOrderCreationGateway(omieClient);

    const updateGateway = isFake
        ? new FakeProductionOrderUpdateGateway()
        : new RealProductionOrderUpdateGateway(omieClient);

    const cancelGateway = isFake
        ? new FakeProductionOrderCancelGateway()
        : new RealProductionOrderCancelGateway(omieClient);

    const changeStageGateway = isFake
        ? new FakeProductionOrderChangeStageGateway()
        : new RealProductionOrderChangeStageGateway(omieClient);

    return { isFake, creationGateway, updateGateway, cancelGateway, changeStageGateway };
}

/**
 * Registra todos os handlers PgBoss para o módulo production-orders.
 * Bridge pura: cria use-cases com gateways injetados e registra handlers
 * que delegam para os use-cases.
 *
 * Deve ser chamado durante o bootstrap, ANTES de `startWorker()`.
 */
export function registerProductionOrderJobHandlers(omieClient: OmieHttpClientPort): void {
    const commandStore = new ProductionOrderCommandStore(prisma);
    const { isFake, creationGateway, updateGateway, cancelGateway, changeStageGateway } = createGateways(omieClient);

    // ── Instancia use-cases de processamento ──────────────────────────

    const createUseCase = new ProcessCreateProductionOrderUseCase(
        creationGateway, commandStore, { isFake }
    );

    const updateUseCase = new ProcessUpdateProductionOrderUseCase(
        updateGateway, commandStore, { isFake }
    );

    const cancelUseCase = new ProcessCancelProductionOrderUseCase(
        cancelGateway, commandStore, { isFake }
    );

    const changeStageUseCase = new ProcessChangeStageProductionOrderUseCase(
        changeStageGateway, commandStore, { isFake }
    );

    // ── 1. CREATE_OP ──────────────────────────────────────────────────

    registerJobHandler<ProcessCreateProductionOrderData>(
        "production-order.create-op",
        (job) => createUseCase.execute(job.data),
        { concurrency: 1, batchSize: 1 }
    );

    // ── 2. UPDATE_OP ──────────────────────────────────────────────────

    registerJobHandler<ProcessUpdateProductionOrderData>(
        "production-order.update-op",
        (job) => updateUseCase.execute(job.data),
        { concurrency: 1, batchSize: 1 }
    );

    // ── 3. CANCEL_OP ──────────────────────────────────────────────────

    registerJobHandler<ProcessCancelProductionOrderData>(
        "production-order.cancel-op",
        (job) => cancelUseCase.execute(job.data),
        { concurrency: 1, batchSize: 1 }
    );

    // ── 4. CHANGE_STAGE ───────────────────────────────────────────────

    registerJobHandler<ProcessChangeStageProductionOrderData>(
        "production-order.change-stage",
        (job) => changeStageUseCase.execute(job.data),
        { concurrency: 1, batchSize: 1 }
    );

    // ── 5. SYNC_GLOBAL: Sincronizar ordens de produção completas (paginação) ──

    registerJobHandler<SyncGlobalJobData>(
        "production-order.sync-global",
        async (job) => {
            const { externalRequestId, pageSize, maxPages, syncItems } = job.data;
            logger.info("Processing sync-global", { externalRequestId, pageSize, maxPages, syncItems });

            const fetchPageGateway = isFake
                ? new FakeProductionOrderSyncPageGateway()
                : new RealProductionOrderSyncPageGateway(omieClient);

            if (!isFake) {
                const syncStateStore = new PrismaSyncStateStore(
                    prisma.productionOrderSyncState,
                    "GLOBAL"
                );

                const hooks = new SyncHooksRunner();

                // Hook pós-sync: enfileira sync-items se solicitado
                if (syncItems ?? true) {
                    hooks.add({
                        name: "sync-items",
                        execute: async () => {
                            logger.info("Enqueuing sync-items after sync-global", { externalRequestId });
                            await enqueueJob("production-order.sync-items", {
                                externalRequestId: `${externalRequestId}-items`,
                                maxOrders: 50,
                            }, {
                                retryLimit: 2,
                                retryBackoff: true,
                                singletonKey: "production-order-sync-items",
                            });
                        },
                    });
                }

                await executeSyncAllProductionOrders(
                    fetchPageGateway,
                    new ProductionOrderSyncStore(prisma),
                    commandStore,
                    syncStateStore,
                    {
                        externalRequestId,
                        pageSize: pageSize ?? 100,
                        maxPages: maxPages ?? 1000,
                        source: "JOB",
                    },
                    hooks
                );
            } else {
                // Modo fake: apenas marca como confirmado
                await commandStore.markConfirmed(externalRequestId);
            }

            logger.info("Sync-global completed", { externalRequestId, syncItems });
        },
        { concurrency: 1, batchSize: 1 }
    );

    // ── 6. SYNC_ITEMS: Buscar itens de ordens via ConsultarOrdemProducao ──

    registerJobHandler<any>(
        "production-order.sync-items",
        async (job) => {
            const { externalRequestId, omieCodes, maxOrders } = job.data ?? {};
            logger.info("Processing sync-items", { externalRequestId, maxOrders, specificCodes: omieCodes?.length ?? 0 });

            if (isFake) {
                logger.info("Fake mode: skipping sync-items");
                return;
            }

            const consultGateway = new RealProductionOrderConsultGateway(omieClient);
            const useCase = new SyncProductionOrderItemsUseCase(consultGateway, prisma);

            const result = await useCase.execute({
                externalRequestId,
                omieCodes,
                maxOrders: maxOrders ?? 50,
            });

            logger.info("Sync-items batch completed", {
                externalRequestId,
                processed: result.processed,
                updated: result.updated,
                failed: result.failed,
                hasMore: result.hasMore,
            });

            // Se ainda há mais ordens, re-enfileira para processar o próximo lote
            if (result.hasMore) {
                logger.info("More orders need items, re-enqueuing", { externalRequestId });
                await enqueueJob("production-order.sync-items", {
                    externalRequestId: `${externalRequestId}-next`,
                    maxOrders: maxOrders ?? 50,
                }, {
                    retryLimit: 2,
                    retryBackoff: true,
                });
            }
        },
        { concurrency: 1, batchSize: 1 }
    );

    logger.info("Production-order PgBoss handlers registered", {
        types: [
            "production-order.create-op",
            "production-order.update-op",
            "production-order.cancel-op",
            "production-order.change-stage",
            "production-order.sync-global",
            "production-order.sync-items",
        ],
    });
}
