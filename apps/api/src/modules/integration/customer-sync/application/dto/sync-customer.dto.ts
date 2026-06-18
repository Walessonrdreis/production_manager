export type SyncCustomerRequestDTO = {
    externalRequestId: string;
};

export type SyncCustomerResponseDTO = {
    status: "ACCEPTED";
    externalRequestId: string;
    customerCode: string;
};
