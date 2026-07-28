export type SyncAllCustomersRequestDTO = {
    externalRequestId?: string;
    pageSize?: number;
    maxPages?: number;
};

export type SyncAllCustomersResponseDTO = {
    status: "ACCEPTED";
    externalRequestId: string;
    resourceId: "__GLOBAL__";
};
