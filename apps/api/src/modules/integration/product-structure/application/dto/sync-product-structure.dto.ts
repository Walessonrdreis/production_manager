export type SyncProductStructureRequestDTO = {
    externalRequestId: string;
    productCode: string;
};

export type SyncProductStructureResponseDTO = {
    status: "ACCEPTED" | "CONFIRMED" | "FAILED";
    externalRequestId: string;
    productCode: string;
};
