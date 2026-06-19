// ---------------------------------------------------------------------------
// Routes: product-stock-fetch
// Registro central de todas as rotas HTTP do módulo.
// ---------------------------------------------------------------------------

import type { FastifyInstance } from "fastify";

import { registerRefreshProductStockRoute } from "./routes/commands/refresh-product-stock.route";
import { registerGetProductStockPositionRoute } from "./routes/read/get-product-stock-position.route";

export async function productStockFetchIntegrationRoutes(app: FastifyInstance) {
    await registerRefreshProductStockRoute(app);
    await registerGetProductStockPositionRoute(app);
}
