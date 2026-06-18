import type { CustomerFetchGateway } from "../ports/customer-fetch.gateway";
import type { OmieCustomerStore } from "../../infrastructure/db/omie-customer.store";
import type { CustomerCommandStore } from "../../infrastructure/db/customer-command.store";

// Contrato: qualquer store que implemente upsertFromExternal
export type IntegrationStoreContract = Pick<OmieCustomerStore, "upsertFromExternal">;
export type CommandStoreContract = Pick<
    CustomerCommandStore,
    "getOrCreateAccepted" | "markConfirmed" | "markFailed"
>;

export type SyncCustomerCommand = {
    externalRequestId: string;
    customerCode: string;
    source?: "API2" | "JOB" | "ADMIN";
};

export class SyncCustomerUseCase {
    constructor(
        private readonly fetchGateway: CustomerFetchGateway,
        private readonly integrationStore: IntegrationStoreContract,
        private readonly commandStore: CommandStoreContract,
        private readonly options: { noWrite?: boolean } = {}
    ) { }

    async execute(command: SyncCustomerCommand) {
        if (this.options.noWrite) {
            await this.fetchGateway.fetchByCustomerCode(command.customerCode);

            return {
                status: "ACCEPTED" as const,
                externalRequestId: command.externalRequestId,
                customerCode: command.customerCode,
            };
        }

        const { record, created } = await this.commandStore.getOrCreateAccepted({
            externalRequestId: command.externalRequestId,
            customerCode: command.customerCode,
            commandType: "SYNC",
            source: command.source ?? "API2",
        });

        if (!created) {
            return {
                status: record.status,
                externalRequestId: command.externalRequestId,
                customerCode: command.customerCode,
            };
        }

        try {
            const externalCustomer = await this.fetchGateway.fetchByCustomerCode(
                command.customerCode
            );

            if (!externalCustomer) {
                throw new Error(`Cliente não encontrado no Omie: ${command.customerCode}`);
            }

            await this.integrationStore.upsertFromExternal({
                customerCode: externalCustomer.customerCode,
                legalName: externalCustomer.legalName,
                tradeName: externalCustomer.tradeName,
                document: externalCustomer.document,
                personType: externalCustomer.personType,
                email: externalCustomer.email,
                phone: externalCustomer.phone,
                isActive: externalCustomer.isActive,
                isBlocked: externalCustomer.isBlocked,
                isBillingBlocked: externalCustomer.isBillingBlocked,
                createdAtOmie: externalCustomer.createdAtOmie,
                updatedAtOmie: externalCustomer.updatedAtOmie,
                rawPayload: externalCustomer.rawPayload,
            });

            await this.commandStore.markConfirmed(command.externalRequestId);

            return {
                status: "ACCEPTED" as const,
                externalRequestId: command.externalRequestId,
                customerCode: externalCustomer.customerCode,
            };
        } catch (error) {
            await this.commandStore.markFailed(command.externalRequestId, error);
            throw error;
        }
    }
}
