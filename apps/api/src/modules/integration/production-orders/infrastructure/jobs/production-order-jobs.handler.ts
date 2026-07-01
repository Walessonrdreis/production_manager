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
import { ProductionOrderReadModelStore } from "../db/production-order-read-model.store";
import { RefreshProductionOrderReadModelUseCase } from "../../application/use-cases/refresh-production-order-read-model.usecase";

type SyncGlobalJobData = {
    externalRequestId: string;
    pageSize?: number;
    maxPages?: number;
    /** Se true, enfileira sync-items após o sync-global */
    syncItems?: boolean;
    /** true = full re-sync, false/omitido = incremental */
    fullSync?: boolean;
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
        async (job) => {
            await updateUseCase.execute(job.data);
            // Fase 1: refresh incremental do read model
            if (job.data.omieId) {
                await enqueueJob("production-order.refresh", {
                    omieId: job.data.omieId,
                }, {
                    retryLimit: 2,
                    retryBackoff: true,
                    singletonKey: `prorm-refresh-${job.data.omieId}`,
                });
            }
        },
        { concurrency: 1, batchSize: 1 }
    );

    // ── 3. CANCEL_OP ──────────────────────────────────────────────────

    registerJobHandler<ProcessCancelProductionOrderData>(
        "production-order.cancel-op",
        async (job) => {
            await cancelUseCase.execute(job.data);
            // Fase 1: refresh incremental do read model
            if (job.data.omieId) {
                await enqueueJob("production-order.refresh", {
                    omieId: job.data.omieId,
                }, {
                    retryLimit: 2,
                    retryBackoff: true,
                    singletonKey: `prorm-refresh-${job.data.omieId}`,
                });
            }
        },
        { concurrency: 1, batchSize: 1 }
    );

    // ── 4. CHANGE_STAGE ───────────────────────────────────────────────

    registerJobHandler<ProcessChangeStageProductionOrderData>(
        "production-order.change-stage",
        async (job) => {
            await changeStageUseCase.execute(job.data);
            // Fase 1: refresh incremental do read model
            if (job.data.omieId) {
                await enqueueJob("production-order.refresh", {
                    omieId: job.data.omieId,
                }, {
                    retryLimit: 2,
                    retryBackoff: true,
                    singletonKey: `prorm-refresh-${job.data.omieId}`,
                });
            }
        },
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
                            logger.debug("Enqueuing sync-items after sync-global", { externalRequestId });
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

                const consultGateway = new RealProductionOrderConsultGateway(omieClient);

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
                        fullSync: job.data.fullSync ?? false,
                    },
                    hooks,
                    {
                        consultGateway,
                        prisma,
                        maxBackfill: 200,
                    }
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
            const { externalRequestId, omieIds, maxOrders } = job.data ?? {};
            logger.debug("Processing sync-items", { externalRequestId, maxOrders, specificCodes: omieIds?.length ?? 0 });

            if (isFake) {
                logger.info("Fake mode: skipping sync-items");
                return;
            }

            const consultGateway = new RealProductionOrderConsultGateway(omieClient);
            const useCase = new SyncProductionOrderItemsUseCase(consultGateway, prisma);

            const result = await useCase.execute({
                externalRequestId,
                omieIds,
                maxOrders: maxOrders ?? 50,
            });

            logger.debug("Sync-items batch completed", {
                externalRequestId,
                processed: result.processed,
                updated: result.updated,
                failed: result.failed,
                hasMore: result.hasMore,
            });

            // Se ainda há mais ordens, re-enfileira para processar o próximo lote
            if (result.hasMore) {
                logger.debug("More orders need items, re-enqueuing", { externalRequestId });
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

    // ── 7. REFRESH_READ_MODEL: Recalcular 1 OP no read model ───────────

    registerJobHandler<{ omieCode: string }>(
        "production-order.refresh",
        async (job) => {
            const { omieCode } = job.data;
            logger.info("Refreshing production order read model", { omieCode });

            try {
                const store = new ProductionOrderReadModelStore();
                const useCase = new RefreshProductionOrderReadModelUseCase(store);
                await useCase.refreshOne(omieCode);
                logger.info("Production order read model refreshed", { omieCode });
            } catch (error) {
                logger.error("Failed to refresh production order read model", {
                    omieCode,
                    error: error instanceof Error ? error.message : String(error),
                });
                throw error; // PgBoss faz retry automático
            }
        },
        { concurrency: 2, batchSize: 1 }
    );

    // ── 8. REFRESH_BY_STOCK: Recalcular OPs após sync de estoque ──────
    // Usa o índice GIN para encontrar OPs abertas com estrutura (BOM)
    // e enfileira refresh em lote (batch).
    // Fase 3: enfileira batch job com startAfter para debounce.
    // Singleton: evita múltiplas execuções simultâneas.

    registerJobHandler<{ skipIfEmpty?: boolean }>(
        "production-order.refresh.by-stock",
        async () => {
            logger.info("Starting by-stock refresh of production order read model");

            // Busca OPs abertas com materiais (materials_json não vazio)
            // usando o índice GIN idx_prorm_materials_gin
            type OpRow = { omie_id: string };
            const ops = await prisma.$queryRaw<OpRow[]>`
                SELECT omie_id
                FROM read_model.production_order_read_model
                WHERE is_open = true
                  AND materials_json IS NOT NULL
                  AND materials_json != '[]'::jsonb
                  AND jsonb_typeof(materials_json) = 'array'
            `;

            if (ops.length === 0) {
                logger.info("No open OPs with materials found for by-stock refresh");
                return;
            }

            logger.info("Found open OPs with materials for by-stock refresh", {
                count: ops.length,
            });

            // Fase 3: enfileira um único batch job com debounce de 5s
            const omieIds = ops.map((op) => op.omie_id);
            const jobId = await enqueueJob("production-order.refresh.batch", {
                omieIds,
                source: "by-stock",
            }, {
                retryLimit: 1,
                startAfter: 5, // debounce window: aguarda 5s para agregar
                singletonKey: "production-order-refresh-batch",
            });

            logger.info("By-stock refresh completed — batch job enqueued", {
                found: ops.length,
                batchJobId: jobId,
            });
        },
        { concurrency: 1, batchSize: 1 }
    );

    // ── 9. REFRESH_BATCH: Processar múltiplos refreshes em lote ────────
    // Fase 3: processa várias OPs numa única execução.
    // - Skip-if-fresh: pula OPs atualizadas nos últimos 60s
    // - Processa as restantes com Promise.allSettled (concorrência controlada)
    // - Aceita source para rastrear origem do batch

    registerJobHandler<{ omieIds: string[]; source?: string }>(
        "production-order.refresh.batch",
        async (job) => {
            const { omieIds, source } = job.data;
            const batchSize = omieIds?.length ?? 0;

            if (batchSize === 0) {
                logger.info("Batch refresh received empty codes list");
                return;
            }

            logger.info("Starting batch refresh", { batchSize, source });

            // ── Skip-if-fresh: verifica lastSyncAt de cada OP ──────────
            // Pula OPs que já foram atualizadas nos últimos 60 segundos
            const FRESH_THRESHOLD_MS = 60_000;
            const cutoff = new Date(Date.now() - FRESH_THRESHOLD_MS);

            type FreshRow = { omie_id: string; last_sync_at: Date | null };
            const freshRecords = await prisma.$queryRaw<FreshRow[]>`
                SELECT omie_id, last_sync_at
                FROM read_model.production_order_read_model
                WHERE omie_id = ANY(${omieIds}::text[])
            `;

            const freshMap = new Map<string, Date | null>(
                freshRecords.map((r) => [r.omie_id, r.last_sync_at])
            );

            const toProcess: string[] = [];
            const skipped: string[] = [];

            for (const id of omieIds) {
                const lastSync = freshMap.get(id);
                if (lastSync && lastSync > cutoff) {
                    skipped.push(id);
                } else {
                    toProcess.push(id);
                }
            }

            logger.info("Batch refresh skip-if-fresh", {
                total: batchSize,
                toProcess: toProcess.length,
                skipped: skipped.length,
            });

            if (toProcess.length === 0) {
                logger.info("Batch refresh — all OPs are fresh, nothing to do");
                return;
            }

            // ── Processa lote ──────────────────────────────────────────
            const store = new ProductionOrderReadModelStore();
            const useCase = new RefreshProductionOrderReadModelUseCase(store);

            // Concorrência controlada: processa em grupos de 5
            const CONCURRENCY = 5;
            const results = { success: 0, failed: 0, errors: [] as string[] };

            for (let i = 0; i < toProcess.length; i += CONCURRENCY) {
                const chunk = toProcess.slice(i, i + CONCURRENCY);
                const outcomes = await Promise.allSettled(
                    chunk.map((omieId) => useCase.refreshOne(omieId))
                );

                for (let j = 0; j < outcomes.length; j++) {
                    const outcome = outcomes[j];
                    if (outcome.status === "fulfilled") {
                        results.success++;
                    } else {
                        results.failed++;
                        results.errors.push(
                            `${chunk[j]}: ${outcome.reason instanceof Error ? outcome.reason.message : String(outcome.reason)}`
                        );
                    }
                }
            }

            logger.info("Batch refresh completed", {
                total: batchSize,
                processed: toProcess.length,
                success: results.success,
                failed: results.failed,
                skipped: skipped.length,
                source,
            });

            if (results.errors.length > 0) {
                logger.warn("Batch refresh errors", {
                    errors: results.errors.slice(0, 10), // primeiros 10 apenas
                });
            }
        },
        { concurrency: 1, batchSize: 1 }
    );

    // ── 10. RECONCILE: Verificar consistência Omie vs read-model (C3) ──

    registerJobHandler<{ externalRequestId: string; omieId?: string }>(
        "production-order.reconcile",
        async (job) => {
            const { externalRequestId, omieId } = job.data;
            logger.info("Processing reconcile", { externalRequestId, omieId });

            try {
                if (isFake) {
                    logger.info("Fake mode: marking reconcile as confirmed");
                    await commandStore.markConfirmed(externalRequestId);
                    return;
                }

                // Reconcile: busca a OP no Omie e atualiza o read-model
                const consultGateway = new RealProductionOrderConsultGateway(omieClient);
                const store = new ProductionOrderReadModelStore();
                const useCase = new RefreshProductionOrderReadModelUseCase(store);

                if (omieId) {
                    // Reconcile de uma OP específica
                    await useCase.refreshOne(omieId);
                } else {
                    // Reconcile completo (refresh de todas as OPs abertas)
                    const result = await useCase.execute();
                    logger.info("Reconcile completed — full refresh done", {
                        externalRequestId,
                        processed: result?.processed,
                    });
                }

                await commandStore.markConfirmed(externalRequestId);
                logger.info("Reconcile completed", { externalRequestId, omieId });
            } catch (error) {
                logger.error("Reconcile failed", {
                    externalRequestId,
                    error: error instanceof Error ? error.message : String(error),
                });
                await commandStore.markFailed(externalRequestId, error);
                throw error;
            }
        },
        { concurrency: 1, batchSize: 1 }
    );

    // ── 11. INVALIDATE: Invalidar read-model de uma OP (C3) ────────────

    registerJobHandler<{ externalRequestId: string; omieId: string }>(
        "production-order.invalidate",
        async (job) => {
            const { externalRequestId, omieId } = job.data;
            logger.info("Processing invalidate", { externalRequestId, omieId });

            try {
                // Invalida o read-model atualizando operationalStatus para "stale"
                // e forçando refresh na próxima consulta
                const store = new ProductionOrderReadModelStore();

                const record = await store.getByOmieCode(omieId);

                if (!record) {
                    logger.warn("Invalidate: OP not found in read-model", { omieId });
                    await commandStore.markConfirmed(externalRequestId);
                    return;
                }

                // Marca como stale e força refresh
                const useCase = new RefreshProductionOrderReadModelUseCase(store);
                await useCase.refreshOne(omieId);

                await commandStore.markConfirmed(externalRequestId);
                logger.info("Invalidate completed — OP refreshed", { externalRequestId, omieId });
            } catch (error) {
                logger.error("Invalidate failed", {
                    externalRequestId,
                    error: error instanceof Error ? error.message : String(error),
                });
                await commandStore.markFailed(externalRequestId, error);
                throw error;
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
            "production-order.refresh",
            "production-order.refresh.by-stock",
            "production-order.refresh.batch",
            "production-order.reconcile",
            "production-order.invalidate",
        ],
    });
}
