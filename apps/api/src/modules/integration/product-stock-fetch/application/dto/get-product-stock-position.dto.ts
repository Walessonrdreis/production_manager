// ---------------------------------------------------------------------------
// DTO: GetProductStockPosition
// ---------------------------------------------------------------------------

export type GetProductStockPositionRequestDTO = {
    productId: string;
};

export type GetProductStockPositionResponseDTO = {
    success: true;
    data: {
        productId: string;
        positionDate: string;
        total: number;
        breakdown: Array<{ stockLocationCode: number; quantity: number }>;
    };
};
