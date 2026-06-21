import { getLogger } from "@/shared/logger";
import type { ProductStructureFetchPageGateway } from "../ports/product-structure-fetch-page.gateway";
import { ProductStructureIntegrationStore } from "../../infrastructure/db/product-structure-integration.store";
import { ProductStructureCommandStore } from "../../infrastructure/db/product-structure-command.store";

export type SyncAllProductStructuresCommand = {
    externalRequestId: string;
    pageSize?: number;
    maxPages?: number;
    source?: "API2" | "JOB" | "ADMIN";
};

export class SyncAllProductStructuresUseCase {
    private readonly logger = getLogger("SyncAllProductStructuresUseCase");

    constructor(
        private readonly fetchPageGateway: ProductStructureFetchPageGateway,
        private readonly integrationStore: ProductStructureIntegrationStore,
        private readonly commandStore: ProductStructureCommandStore,
        private readonly options: { noWrite?: boolean } = {}
    ) { }

    async execute(command: SyncAllProductStructuresCommand) {
        const pageSize = Math.max(1, Math.min(Number(command.pageSize || 100), 500));
        const maxPages = Math.max(1, Math.min(Number(command.maxPages || 1000), 10000));

        this.logger.info("Product-structure global sync started", {
            externalRequestId: command.externalRequestId,
            pageSize,
            maxPages,
            source: command.source ?? "API2",
            noWrite: this.options.noWrite === true,
        });

        if (this.options.noWrite) {
            let page = 1;
            let processedPages = 0;
            let processedItems = 0;

            while (processedPages < maxPages) {
                const pageResult = await this.fetchPageGateway.fetchPage(page, pageSize);

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

        const { record, created } = await this.commandStore.getOrCreateAccepted({
            externalRequestId: command.externalRequestId,
            productCode: "__GLOBAL__",
            commandType: "SYNC",
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

        try {
            let page = 1;
            let processedPages = 0;
            let processedItems = 0;

            while (processedPages < maxPages) {
                const pageResult = await this.fetchPageGateway.fetchPage(page, pageSize);

                for (const item of pageResult.items) {
                    await this.integrationStore.save({
                        productCode: item.productCode,
                        hasStructure: item.hasStructure,
                        items: item.items.map((i) => ({
                            componentCode: i.componentCode,
                            quantity: i.quantity,
                            unit: i.unit ?? undefined,
                        })),
                    });
                }

                processedPages += 1;
                processedItems += pageResult.items.length;

                this.logger.info("Page processed", {
                    externalRequestId: command.externalRequestId,
                    page,
                    items: pageResult.items.length,
                    processedPages,
                    processedItems,
                    hasNextPage: pageResult.hasNextPage,
                });

                if (!pageResult.hasNextPage || pageResult.items.length === 0) break;

                page += 1;
            }

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
