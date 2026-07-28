export type ApplyProductStructureItemDTO = {
    componentCode: string;
    quantity: string | number;
    unit?: string;
    loss?: string | number;
};

export type ApplyProductStructureRequestDTO = {
    externalRequestId: string;
    productCode: string;
    items: ApplyProductStructureItemDTO[];
};

export type ApplyProductStructureResponseDTO = {
    status: "ACCEPTED" | "CONFIRMED" | "FAILED";
    externalRequestId: string;
    productCode: string;
};
