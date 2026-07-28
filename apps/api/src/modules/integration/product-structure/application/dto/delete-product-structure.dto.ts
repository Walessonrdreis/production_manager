export type DeleteProductStructureRequestDTO = {
    externalRequestId: string;
    productCode: string;
};

export type DeleteProductStructureResponseDTO = {
    status: "ACCEPTED" | "CONFIRMED" | "FAILED";
    externalRequestId: string;
    productCode: string;
};
