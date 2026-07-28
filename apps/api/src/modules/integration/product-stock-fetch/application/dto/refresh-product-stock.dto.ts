// ---------------------------------------------------------------------------
// DTO: RefreshProductStock
// ---------------------------------------------------------------------------

export type RefreshProductStockRequestDTO = {
    externalRequestId: string;
    productId: string;
};

export type RefreshProductStockResponseDTO = {
    status: "ACCEPTED";
    externalRequestId: string;
    productId: string;
};
