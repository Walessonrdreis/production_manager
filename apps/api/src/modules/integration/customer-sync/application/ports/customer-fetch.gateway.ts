export type CustomerExternalCustomer = {
    customerCode: string;
    legalName: string;
    tradeName: string | null;
    document: string;
    personType: string;
    email: string | null;
    phone: string | null;
    isActive: boolean;
    isBlocked: boolean;
    isBillingBlocked: boolean;
    createdAtOmie: Date | null;
    updatedAtOmie: Date | null;
    rawPayload: any;
};

export interface CustomerFetchGateway {
    fetchByCustomerCode(customerCode: string): Promise<CustomerExternalCustomer | null>;
}
