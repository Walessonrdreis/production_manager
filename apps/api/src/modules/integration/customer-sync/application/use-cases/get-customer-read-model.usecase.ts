import { OmieCustomerStore } from "../../infrastructure/db/omie-customer.store";

export type GetCustomerQuery = {
    view?: "summary" | "data";
    q?: string | null;
    activeOnly?: boolean;
    customerCodes?: string[] | null;
    document?: string | null;
    limit?: number;
    offset?: number;
    sort?: "legalName" | "customerCode" | "document" | "lastSyncAt";
    order?: "asc" | "desc";
    since?: string | null;
    fields?: string[] | null;
    includeRaw?: boolean;
};

export class GetCustomerReadModelUseCase {
    constructor(private readonly store: OmieCustomerStore) { }

    async execute(params: GetCustomerQuery = {}) {
        const result = await this.store.list(params);

        if (params.view === "summary") {
            return { summary: result.summary };
        }

        if (params.view === "data") {
            return { data: result.data };
        }

        return result;
    }

    async executeByCustomerCode(
        customerCode: string,
        options?: { includeRaw?: boolean }
    ) {
        return this.store.findByCustomerCode(customerCode, options);
    }
}
