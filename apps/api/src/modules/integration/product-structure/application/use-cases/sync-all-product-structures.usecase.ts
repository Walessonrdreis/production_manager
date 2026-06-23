import { enqueueJob } from "@/shared/infra/job-queue";
import { getLogger } from "@/shared/logger";
import type { ProductStructureFetchPageGateway } from "../ports/product-structure-fetch-page.gateway";
import { ProductStructureIntegrationStore } from "../../infrastructure/db/product-structure-integration.store";
import { ProductStructureCommandStore } from "../../infrastructure/db/product-structure-command.store";
import { fetchPageWithRetry, sleep } from "@/shared/integration/strategies/retry.strategy";
import type { SyncStateStoreContract } from "@/shared/integration/strategies/types";
import type { SyncHooksRunner } from "@/shared/integration/strategies/sync-hooks";

export type SyncAllProductStructuresCommand = {
    externalRequestId: string;
    pageSize?: number;
    maxPages?: number;
    source?: "API2" | "JOB" | "ADMIN";
};

/**
 * Use case — Sync ALL product structures (global BOM sync)
 *
 * Queue pattern:
 * - noWrite (fake) → executa paginação direto, sem tracking
 * - Real → enfileira (PENDING) e retorna; queue processor executa a paginação
 */
export class SyncAllProductStructuresUseCase {
    private readonly logger = getLogger("SyncAllProductStructuresUseCase");

    constructor(
        private readonly fetchPageGateway: ProductStructureFetchPageGateway,
        private readonly integrationStore: ProductStructureIntegrationStore,
        private readonly commandStore: ProductStructureCommandStore,
        private readonly syncStateStore: SyncStateStoreContract,
        private readonly options: { noWrite?: boolean } = {}
    ) { }

    async execute(command: SyncAllProductStructuresCommand) {
        const externalRequestId = command.externalRequestId;

        // ─── Modo no-write (fake): executa paginação direto ─────────
        if (this.options.noWrite) {
            const pageSize = Math.max(1, Math.min(Number(command.pageSize || 100), 500));
            const maxPages = Math.max(1, Math.min(Number(command.maxPages || 1000), 10000));

            this.logger.info("Product-structure global sync no-write", {
                externalRequestId,
                pageSize, maxPages,
                source: command.source ?? "API2",
            });

            let page = 1;
            let processedPages = 0;
            let processedItems = 0;

            while (processedPages < maxPages) {
                const pageResult = await this.fetchPageGateway.fetchPage({ page, pageSize });

                processedPages += 1;
                processedItems += pageResult.items.length;

                this.logger.info("Fake no-write page processed", {
                    externalRequestId,
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
                externalRequestId,
                resourceId: "__GLOBAL__" as const,
            };
        }

        // ─── Modo real: enfileira para processamento assíncrono ─────
        const { record, created } = await this.commandStore.enqueue({
            externalRequestId,
            productCode: "__GLOBAL__",
            commandType: "SYNC_GLOBAL",
            payload: {
                pageSize: command.pageSize,
                maxPages: command.maxPages,
            },
            source: command.source ?? "API2",
        });

        if (!created) {
            this.logger.info("Global sync already enqueued", {
                externalRequestId,
                status: record.status,
            });

            return {
                status: record.status as any,
                externalRequestId,
                resourceId: "__GLOBAL__" as const,
            };
        }

        this.logger.info("Global sync enqueued", { externalRequestId });

        // Enfileira no PgBoss para processamento assíncrono
        await enqueueJob("product-structure.sync-global", {
            externalRequestId,
            pageSize: command.pageSize,
            maxPages: command.maxPages,
        }, {
            retryLimit: 2,
            retryBackoff: true,
            singletonKey: "product-structure-sync-global",
        });

        return {
            status: "ACCEPTED" as const,
            externalRequestId,
            resourceId: "__GLOBAL__" as const,
        };
    }
}

// ─── Função auxiliar exportada para execução direta pelo queue processor ──

export async function executeSyncAllProductStructures(
    fetchPageGateway: ProductStructureFetchPageGateway,
    integrationStore: ProductStructureIntegrationStore,
    commandStore: ProductStructureCommandStore,
    syncStateStore: SyncStateStoreContract,
    command: SyncAllProductStructuresCommand,
    hooks?: SyncHooksRunner
): Promise<void> {
    const logger = getLogger("SyncAllProductStructuresExecutor");
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
            () => fetchPageGateway.fetchPage({ page, pageSize, updatedSince: lastSyncAt }),
            { label: "product-structure", externalRequestId, page, pageSize }
        );

        for (const item of pageResult.items) {
            await integrationStore.save({
                productCode: item.productCode,
                description: item.description,
                familyCode: item.familyCode,
                familyDescription: item.familyDescription,
                productType: item.productType,
                unit: item.unit,
                grossWeight: item.grossWeight,
                netWeight: item.netWeight,
                omieProductId: item.omieProductId,
                omieProductIntegrationId: null,
                hasStructure: item.hasStructure,
                items: item.items.map((i) => ({
                    componentCode: i.componentCode,
                    description: i.description,
                    familyCode: i.familyCode,
                    familyDescription: i.familyDescription,
                    quantity: i.quantity,
                    unit: i.unit,
                    loss: i.loss,
                    omieMeshId: i.omieMeshId,
                    productType: null,
                })),
            });
        }

        processedPages += 1;
        processedItems += pageResult.items.length;

        logger.info("Page processed", {
            externalRequestId,
            page,
            items: pageResult.items.length,
            totalPages: pageResult.totalPages,
            currentPage: pageResult.currentPage,
            processedPages, processedItems,
            hasNextPage: pageResult.hasNextPage,
        });

        if (processedPages % 10 === 0) {
            logger.info("Product-structure sync checkpoint", {
                externalRequestId,
                progress:
                    pageResult.totalPages != null
                        ? `${page}/${pageResult.totalPages}`
                        : `${page}/?`,
                processedPages,
                processedItems,
            });
        }

        if (!pageResult.hasNextPage || pageResult.items.length === 0) break;
        page += 1;

        await sleep(700);
    }

    await syncStateStore.updateLastSync(new Date());
    await commandStore.markConfirmed(externalRequestId);

    // ─── Side-effect chaining (hooks opcionais pós-sync) ────────────
    if (hooks && !hooks.empty) {
        logger.info("Running post-sync hooks", { externalRequestId });
        await hooks.runAll({ externalRequestId });
    }

    logger.info("Global sync completed", { externalRequestId, processedPages, processedItems });
}
