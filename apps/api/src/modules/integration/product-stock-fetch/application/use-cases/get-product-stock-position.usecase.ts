// ---------------------------------------------------------------------------
// Use Case: GetProductStockPositionUseCase
// Consulta a posição de estoque de um produto no sistema externo (Omie).
// ---------------------------------------------------------------------------

import type { ProductStockFetchGateway } from "../ports/product-stock-fetch.gateway";

export type ProductStockFetchPort = Pick<ProductStockFetchGateway, "fetch">;

export class GetProductStockPositionUseCase {
    constructor(private readonly fetchGateway: ProductStockFetchPort) { }

    async execute(productId: string) {
        const result = await this.fetchGateway.fetch(productId);
        return result;
    }
}
