import type {
    CustomerFetchPageGateway,
    CustomerFetchPageInput,
    CustomerFetchPageResult,
} from "../../../application/ports/customer-fetch-page.gateway";

export class FakeCustomerFetchPageGateway implements CustomerFetchPageGateway {
    async fetchPage({ page, pageSize }: CustomerFetchPageInput): Promise<CustomerFetchPageResult> {
        if (page > 1) {
            return {
                items: [],
                totalPages: 1,
                currentPage: page,
                totalRecords: 0,
                hasNext: false,
            };
        }

        const items = Array.from({ length: Math.min(pageSize, 5) }).map((_, index) => ({
            customerCode: `FAKE-CUSTOMER-${index + 1}`,
            legalName: `Fake Customer ${index + 1} Ltda`,
            tradeName: `Fake ${index + 1}`,
            document: `00.000.000/000${index + 1}`,
            personType: "PJ",
            email: `fake-${index + 1}@email.com`,
            phone: "11999999999",
            isActive: true,
            isBlocked: false,
            isBillingBlocked: false,
            createdAtOmie: new Date(),
            updatedAtOmie: new Date(),
            rawPayload: {
                fake: true,
                page,
                index,
            },
        }));

        return {
            items,
            totalPages: 1,
            currentPage: page,
            totalRecords: items.length,
            hasNext: false,
        };
    }
}
