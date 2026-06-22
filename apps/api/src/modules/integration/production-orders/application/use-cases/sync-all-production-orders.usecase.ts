// ---------------------------------------------------------------------------
// Use Case — Sync All Production Orders (Omie → nosso DB)
// ---------------------------------------------------------------------------
// Segue o padrão de SyncAllProductStructuresUseCase.
// Percorre todas as páginas da Omie, persiste no espelho local
// (OmieProductionOrder) e atualiza checkpoint incremental.
// ---------------------------------------------------------------------------

import { getLogger } from "@/shared/logger";
import type { ProductionOrderSyncPageGateway } from "../ports/production-order-sync-page.gateway";
import { ProductionOrderCommandStore } from "../../infrastructure/db/production-order-command.store";
import { ProductionOrderSyncStore } from "../../infrastructure/db/production-order-sync.store";
import { fetchPageWithRetry } from "@/shared/integration/strategies/retry.strategy";
import type { SyncStateStoreContract } from "@/shared/integration/strategies/types";

export type SyncAllProductionOrdersCommand = {
    externalRequestId: string;
    pageSize?: number;
    maxPages?: number;
    source?: "API2" | "JOB" | "ADMIN";
};

export class SyncAllProductionOrdersUseCase {
    private readonly logger = getLogger("SyncAllProductionOrdersUseCase");

    constructor(
        private readonly fetchPageGateway: ProductionOrderSyncPageGateway,        private readonly syncStore: ProductionOrderSyncStore,        private readonly commandStore: ProductionOrderCommandStore,
        private readonly syncStateStore: SyncStateStoreContract,
        private readonly options: { noWrite?: boolean } = {}
    ) { }

    async execute(command: SyncAllProductionOrdersCommand) {
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

                this.logger.info("Fake no-write page processed", {
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

        // ── Sync incremental ─────────────────────────────────────────────
        try {
            const state = await this.syncStateStore.getState();
            const lastSyncAt = state.lastSyncAt;

            this.logger.info("Production-orders incremental sync window", {
                externalRequestId: command.externalRequestId,
                lastSyncAt,
            });

            let page = 1;
            let processedPages = 0;
            let processedItems = 0;

            while (processedPages < maxPages) {
                const pageResult = await fetchPageWithRetry(
                    () =>
                        this.fetchPageGateway.fetchPage({
                            page,
                            pageSize,
                            updatedSince: lastSyncAt,
                        }),
                    {
                        label: "production-orders",
                        externalRequestId: command.externalRequestId,
                        page,
                        pageSize,
                    }
                );

                processedPages += 1;
                processedItems += pageResult.items.length;

                // Persiste cada item no espelho local
                for (const item of pageResult.items) {
                    await this.syncStore.save(item);
                }

                this.logger.info("Page processed", {
                    externalRequestId: command.externalRequestId,
                    page,
                    items: pageResult.items.length,
                    totalPages: pageResult.totalPages,
                    currentPage: pageResult.currentPage,
                    processedPages,
                    processedItems,
                    hasNextPage: pageResult.hasNextPage,
                });

                if (!pageResult.hasNextPage || pageResult.items.length === 0) break;
                page += 1;
            }

            await this.syncStateStore.updateLastSync(new Date());
            await this.commandStore.markConfirmed(command.externalRequestId);

            this.logger.info("Global sync completed", {
                externalRequestId: command.externalRequestId,
                processedPages,
                processedItems,
            });

            return {
                status: "ACCEPTED" as const,
                externalRequestId: command.externalRequestId,
                resourceId: "__GLOBAL__" as const,
            };
        } catch (err) {
            await this.commandStore.markFailed(command.externalRequestId, err);
            throw err;
        }
    }
}
