// ---------------------------------------------------------------------------
// Port: ProductStockFetchGateway
// Define o contrato para consulta de posição de estoque no sistema externo (Omie).
// ---------------------------------------------------------------------------

export type ProductStockExternalItem = {
    productId: string;
    stockLocationCode: number;
    quantity: number;
};

export type ProductStockFetchResult = {
    productId: string;
    positionDate: string; // DD/MM/YYYY
    total: number;
    breakdown: Array<{ stockLocationCode: number; quantity: number }>;
};

export interface ProductStockFetchGateway {
    fetch(productId: string): Promise<ProductStockFetchResult>;
}
