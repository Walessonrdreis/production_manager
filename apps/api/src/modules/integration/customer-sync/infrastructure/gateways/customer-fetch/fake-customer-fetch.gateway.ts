import type {
    CustomerExternalCustomer,
    CustomerFetchGateway,
} from "../../../application/ports/customer-fetch.gateway";

export class FakeCustomerFetchGateway implements CustomerFetchGateway {
    async fetchByCustomerCode(customerCode: string): Promise<CustomerExternalCustomer | null> {
        return {
            customerCode,
            legalName: `FAKE CUSTOMER ${customerCode}`,
            tradeName: `Fake ${customerCode}`,
            document: `00.000.000/0001-${customerCode.slice(-1)}`,
            personType: "PJ",
            email: `fake-${customerCode}@email.com`,
            phone: "11999999999",
            isActive: true,
            isBlocked: false,
            isBillingBlocked: false,
            createdAtOmie: new Date(),
            updatedAtOmie: new Date(),
            rawPayload: {
                fake: true,
                customerCode,
                reason: "Fake gateway ativo (customer-sync)",
            },
        };
    }
}
