export type SyncAllProductStructureRequestDTO = {
    externalRequestId?: string;
    pageSize?: number;
    maxPages?: number;
};

export type SyncAllProductStructureResponseDTO = {
    status: "ACCEPTED";
    externalRequestId: string;
    resourceId: "__GLOBAL__";
};
