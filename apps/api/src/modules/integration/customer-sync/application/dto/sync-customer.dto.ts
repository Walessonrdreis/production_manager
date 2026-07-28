export type SyncCustomerRequestDTO = {
    externalRequestId: string;
    customerCode: string;
};

export type SyncCustomerResponseDTO = {
    status: "ACCEPTED";
    externalRequestId: string;
    customerCode: string;
};
