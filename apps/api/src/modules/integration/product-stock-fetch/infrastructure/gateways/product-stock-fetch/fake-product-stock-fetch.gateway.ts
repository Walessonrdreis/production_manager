// ---------------------------------------------------------------------------
// Fake Gateway: FakeProductStockFetchGateway
// Retorna dados mock de posição de estoque sem chamar o Omie.
// ---------------------------------------------------------------------------

import type { ProductStockFetchGateway, ProductStockFetchResult } from "../../../application/ports/product-stock-fetch.gateway";

function getTodayBr(): string {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, "0");
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const year = today.getFullYear();
    return `${day}/${month}/${year}`;
}

export class FakeProductStockFetchGateway implements ProductStockFetchGateway {
    async fetch(productId: string): Promise<ProductStockFetchResult> {
        // Retorna dados mock
        return {
            productId,
            positionDate: getTodayBr(),
            total: 150,
            breakdown: [
                { stockLocationCode: 1, quantity: 100 },
                { stockLocationCode: 2, quantity: 50 },
            ],
        };
    }
}
