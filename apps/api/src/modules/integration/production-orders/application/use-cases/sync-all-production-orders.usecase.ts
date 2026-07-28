// ---------------------------------------------------------------------------
// Use Case — Sync All Production Orders (Omie → nosso DB)
// ---------------------------------------------------------------------------
// Segue o padrão de SyncAllProductStructuresUseCase.
// Percorre todas as páginas da Omie, persiste no espelho local
// (OmieProductionOrder) e atualiza checkpoint incremental.
// ---------------------------------------------------------------------------

import { getLogger } from "@/shared/logger";
import type { ProductionOrderSyncPageGateway } from "../ports/production-order-sync-page.gateway";
import type { ProductionOrderConsultGateway } from "../ports/production-order-consult.gateway";
import { ProductionOrderCommandStore } from "../../infrastructure/db/production-order-command.store";
import { ProductionOrderSyncStore } from "../../infrastructure/db/production-order-sync.store";
import type { PrismaClient } from "@prisma/client";
import { fetchPageWithRetry, sleep } from "@/shared/integration/strategies/retry.strategy";
import type { SyncStateStoreContract } from "@/shared/integration/strategies/types";
import { SyncHooksRunner } from "@/shared/integration/strategies/sync-hooks";
import { enqueueJob } from "@/shared/infra/job-queue";

export type SyncAllProductionOrdersCommand = {
    externalRequestId: string;
    pageSize?: number;
    maxPages?: number;
    source?: "API2" | "JOB" | "ADMIN";
    /** true = full re-sync (ignora lastSyncAt), false/omitido = só delta */
    fullSync?: boolean;
};

export class SyncAllProductionOrdersUseCase {
    private readonly logger = getLogger("SyncAllProductionOrdersUseCase");

    constructor(
        private readonly fetchPageGateway: ProductionOrderSyncPageGateway, private readonly syncStore: ProductionOrderSyncStore, private readonly commandStore: ProductionOrderCommandStore,
        private readonly syncStateStore: SyncStateStoreContract,
        private readonly options: { noWrite?: boolean } = {}
    ) { }

    async execute(
        command: SyncAllProductionOrdersCommand,
        hooks?: SyncHooksRunner
    ) {
        const pageSize = Math.max(
            1,
            Math.min(Number(command.pageSize || 100), 500)
        );
        const maxPages = Math.max(
            1,
            Math.min(Number(command.maxPages || 1000), 10000)
        );

        this.logger.info("Production-orders global sync started", {
            externalRequestId: command.externalRequestId,
            pageSize,
            maxPages,
            source: command.source ?? "API2",
            noWrite: this.options.noWrite === true,
        });

        // ── Mode no-write (apenas validação) ──────────────────────────────
        if (this.options.noWrite) {
            let page = 1;
            let processedPages = 0;
            let processedItems = 0;

            while (processedPages < maxPages) {
                const pageResult = await this.fetchPageGateway.fetchPage({
                    page,
                    pageSize,
                });

                processedPages += 1;
                processedItems += pageResult.items.length;

                this.logger.debug("Fake no-write page processed", {
                    externalRequestId: command.externalRequestId,
                    page,
                    items: pageResult.items.length,
                    processedPages,
                    processedItems,
                });

                if (!pageResult.hasNextPage || pageResult.items.length === 0) break;
                page += 1;
            }

            return {
                status: "ACCEPTED" as const,
                externalRequestId: command.externalRequestId,
                resourceId: "__GLOBAL__" as const,
            };
        }

        // ── Idempotência ─────────────────────────────────────────────────
        const { record, created } =
            await this.commandStore.getOrCreateAccepted({
                externalRequestId: command.externalRequestId,
                commandType: "SYNC_GLOBAL",
                source: command.source ?? "API2",
            });

        if (!created) {
            this.logger.info("Global sync already tracked", {
                externalRequestId: command.externalRequestId,
                status: record.status,
            });

            return {
                status: record.status,
                externalRequestId: command.externalRequestId,
                resourceId: "__GLOBAL__" as const,
            };
        }

        // ── Enfileira no PgBoss para execução assíncrona ─────────────────
        this.logger.info("Global sync enqueued", {
            externalRequestId: command.externalRequestId,
        });

        await enqueueJob("production-order.sync-global", {
            externalRequestId: command.externalRequestId,
            pageSize: command.pageSize,
            maxPages: command.maxPages,
            fullSync: command.fullSync ?? false,
            syncItems: true,
        }, {
            retryLimit: 2,
            retryBackoff: true,
            singletonKey: "production-order-sync-global",
        });

        return {
            status: "ACCEPTED" as const,
            externalRequestId: command.externalRequestId,
            resourceId: "__GLOBAL__" as const,
        };
    }
}

// ─── Função auxiliar exportada para execução direta pelo queue processor ──

export async function executeSyncAllProductionOrders(
    fetchPageGateway: ProductionOrderSyncPageGateway,
    syncStore: ProductionOrderSyncStore,
    commandStore: ProductionOrderCommandStore,
    syncStateStore: SyncStateStoreContract,
    command: SyncAllProductionOrdersCommand,
    hooks?: SyncHooksRunner,
    backfillConfig?: {
        consultGateway: ProductionOrderConsultGateway;
        prisma: PrismaClient;
        maxBackfill?: number;
    }
): Promise<void> {
    const logger = getLogger("SyncAllProductionOrdersExecutor");
    const pageSize = Math.max(1, Math.min(Number(command.pageSize || 100), 500));
    const maxPages = Math.max(1, Math.min(Number(command.maxPages || 1000), 10000));
    const { externalRequestId } = command;

    logger.info("Executing global sync", { externalRequestId, pageSize, maxPages });

    const state = await syncStateStore.getState();
    const lastSyncAt = state.lastSyncAt;

    let page = 1;
    let processedPages = 0;
    let processedItems = 0;

    while (processedPages < maxPages) {
        const pageResult = await fetchPageWithRetry(
            () => fetchPageGateway.fetchPage({
                page,
                pageSize,
                updatedSince: command.fullSync ? undefined : lastSyncAt,
            }),
            {
                label: "production-orders",
                externalRequestId,
                page,
                pageSize,
            }
        );

        processedPages += 1;
        processedItems += pageResult.items.length;

        // Persiste página inteira em batch (mais eficiente)
        await syncStore.saveMany(pageResult.items);

        logger.info("Page processed", {
            externalRequestId,
            page,
            items: pageResult.items.length,
            totalPages: pageResult.totalPages,
            currentPage: pageResult.currentPage,
            processedPages,
            processedItems,
            hasNextPage: pageResult.hasNextPage,
        });

        // Checkpoint a cada 10 páginas
        if (processedPages % 10 === 0) {
            logger.info("Checkpoint reached", {
                externalRequestId,
                processedPages,
                processedItems,
            });
        }

        if (!pageResult.hasNextPage || pageResult.items.length === 0) break;
        page += 1;

        // Rate-limit: pausa entre páginas
        if (pageResult.hasNextPage) {
            await sleep(700);
        }
    }

    await syncStateStore.updateLastSync(new Date());
    await commandStore.markConfirmed(externalRequestId);

    // Executa hooks pós-sync (se houver)
    if (hooks && hooks.any) {
        await hooks.runAll({ externalRequestId });
    }

    logger.info("Global sync completed", {
        externalRequestId,
        processedPages,
        processedItems,
    });

    // ── Backfill: varre registros incompletos no banco e consulta Omie ──
    // Change Detection ≠ Data Completeness
    // Registros que não foram retornados pela Omie no sync incremental
    // (filtrados por dDtConclusaoDe) nunca passam pelo isComplete().
    // Precisamos buscá-los individualmente via ConsultarOrdemProducao.
    if (backfillConfig) {
        const { consultGateway, prisma: prismaClient } = backfillConfig;
        const maxBackfill = backfillConfig.maxBackfill ?? 200;

        logger.info("Starting backfill for incomplete production orders", {
            externalRequestId,
            maxBackfill,
        });

        try {
            // 1. Busca registros locais que estão incompletos (order_number IS NULL)
            const incompleteRecords = await prismaClient.omieProductionOrder.findMany({
                where: { orderNumber: null },
                select: { omieId: true },
                take: maxBackfill,
            });

            if (incompleteRecords.length === 0) {
                logger.info("No incomplete records found for backfill", {
                    externalRequestId,
                });
            } else {
                logger.info("Backfill: consulting incomplete records individually", {
                    externalRequestId,
                    total: incompleteRecords.length,
                });

                let backfilledCount = 0;
                let errorCount = 0;

                for (let i = 0; i < incompleteRecords.length; i++) {
                    const { omieId } = incompleteRecords[i];
                    try {
                        const consultResult = await consultGateway.consult(omieId);
                        if (consultResult) {
                            await syncStore.saveFromConsultResult(consultResult);
                            backfilledCount++;
                        }
                    } catch (err) {
                        errorCount++;
                        logger.warn("Backfill: consult failed for OP", {
                            externalRequestId,
                            omieId,
                            error: String(err),
                        });
                    }

                    // Progress log a cada 20 registros
                    if ((i + 1) % 20 === 0) {
                        logger.info("Backfill progress", {
                            externalRequestId,
                            processed: i + 1,
                            total: incompleteRecords.length,
                            backfilled: backfilledCount,
                            errors: errorCount,
                        });
                    }

                    // Rate-limit entre consultas individuais
                    if (i < incompleteRecords.length - 1) {
                        await sleep(300);
                    }
                }

                logger.info("Backfill completed", {
                    externalRequestId,
                    total: incompleteRecords.length,
                    backfilled: backfilledCount,
                    errors: errorCount,
                });
            }
        } catch (err) {
            // Erro no backfill não quebra o sync — apenas loga
            logger.error("Backfill failed with unexpected error", {
                externalRequestId,
                error: String(err),
            });
        }
    }
}
