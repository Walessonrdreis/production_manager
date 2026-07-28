import { OmieCustomerStore } from "../../infrastructure/db/omie-customer.store";

export class GetCustomerStatsUseCase {
    constructor(private readonly store: OmieCustomerStore) { }

    async execute() {
        return this.store.getStats();
    }
}
