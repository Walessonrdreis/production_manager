import { getLogger } from "@/shared/logger";
import type { CustomerFetchPageGateway } from "../ports/customer-fetch-page.gateway";
import type { OmieCustomerStore } from "../../infrastructure/db/omie-customer.store";
import type { CustomerCommandStore } from "../../infrastructure/db/customer-command.store";
import { fetchPageWithRetry, sleep } from "@/shared/integration/strategies/retry.strategy";
import type { SyncStateStoreContract } from "@/shared/integration/strategies/types";

// Contrato: qualquer store que implemente upsertFromExternal e saveMany
export type IntegrationStoreContract = Pick<OmieCustomerStore, "upsertFromExternal" | "saveMany">;
export type CommandStoreContract = Pick<
    CustomerCommandStore,
    "getOrCreateAccepted" | "markConfirmed" | "markFailed"
>;

export type SyncAllCustomersCommand = {
    externalRequestId: string;
    pageSize?: number;
    maxPages?: number;
    source?: "API2" | "JOB" | "ADMIN";
};

export class SyncAllCustomersUseCase {
    private readonly logger = getLogger("SyncAllCustomersUseCase");

    constructor(
        private readonly fetchPageGateway: CustomerFetchPageGateway,
        private readonly integrationStore: IntegrationStoreContract,
        private readonly commandStore: CommandStoreContract,
        private readonly stateStore: SyncStateStoreContract,
        private readonly options: { noWrite?: boolean } = {}
    ) { }

    async execute(command: SyncAllCustomersCommand) {
        const pageSize = Math.max(1, Math.min(Number(command.pageSize || 100), 500));
        const maxPages = Math.max(1, Math.min(Number(command.maxPages || 1000), 10000));

        this.logger.info("Starting customer global sync", {
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
                const pageResult = await this.fetchPageGateway.fetchPage({ page, pageSize });

                processedPages += 1;
                processedItems += pageResult.items.length;

                this.logger.info("Fake no-write page processed", {
                    externalRequestId: command.externalRequestId,
                    page,
                    items: pageResult.items.length,
                    processedPages,
                    processedItems,
                });

                if (!pageResult.hasNext || pageResult.items.length === 0) {
                    break;
                }

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
            customerCode: "__GLOBAL__",
            commandType: "SYNC",
            source: command.source ?? "API2",
        });

        if (!created) {
            return {
                status: record.status,
                externalRequestId: command.externalRequestId,
                resourceId: "__GLOBAL__" as const,
            };
        }

        let page = 1;
        let totalItems = 0;
        let processedPages = 0;
        let hasError = false;

        try {
            const state = await this.stateStore.getState();
            const lastSyncAt = state.lastSyncAt;

            this.logger.info("Customer sync window", {
                externalRequestId: command.externalRequestId,
                lastSyncAt,
                isIncremental: lastSyncAt > new Date("2000-01-01"),
            });

            while (processedPages < maxPages) {
                const pageResult = await fetchPageWithRetry(
                    () => this.fetchPageGateway.fetchPage({ page, pageSize, updatedSince: lastSyncAt }),
                    {
                        label: "customer",
                        externalRequestId: command.externalRequestId,
                        page,
                        pageSize,
                    }
                );

                processedPages += 1;

                if (pageResult.items.length > 0) {
                    totalItems += pageResult.items.length;

                    await this.integrationStore.saveMany(
                        pageResult.items.map((item) => ({
                            customerCode: item.customerCode,
                            legalName: item.legalName,
                            tradeName: item.tradeName,
                            document: item.document,
                            personType: item.personType,
                            email: item.email,
                            phone: item.phone,
                            isActive: item.isActive,
                            isBlocked: item.isBlocked,
                            isBillingBlocked: item.isBillingBlocked,
                            createdAtOmie: item.createdAtOmie,
                            updatedAtOmie: item.updatedAtOmie,
                            rawPayload: item.rawPayload,
                        })),
                    );
                }

                this.logger.info("Customer sync page processed", {
                    externalRequestId: command.externalRequestId,
                    page,
                    items: pageResult.items.length,
                    processedPages,
                    totalItems,
                });

                if (processedPages % 10 === 0) {
                    this.logger.info("Customer sync checkpoint", {
                        externalRequestId: command.externalRequestId,
                        processedPages,
                        totalItems,
                    });
                }

                if (!pageResult.hasNext || pageResult.items.length === 0) {
                    break;
                }

                page += 1;
                await sleep(700);
            }

            await this.commandStore.markConfirmed(command.externalRequestId);
            await this.stateStore.updateLastSync(new Date());
        } catch (error) {
            hasError = true;
            await this.commandStore.markFailed(command.externalRequestId, error);
            throw error;
        }

        this.logger.info("Customer global sync completed", {
            externalRequestId: command.externalRequestId,
            processedPages,
            totalItems,
            hasError,
        });

        return {
            status: "ACCEPTED" as const,
            externalRequestId: command.externalRequestId,
            resourceId: "__GLOBAL__" as const,
        };
    }
}
