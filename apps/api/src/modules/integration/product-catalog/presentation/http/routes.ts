import type { FastifyInstance } from "fastify";

import { registerSyncProductCatalogRoute } from "./routes/commands/sync-product-catalog.route";
import { registerSyncAllProductCatalogRoute } from "./routes/commands/sync-all-product-catalog.route";
import { registerGetProductCatalogReadModelRoute } from "./routes/read/get-product-catalog-read-model.route";

export async function productCatalogIntegrationRoutes(app: FastifyInstance) {
  registerSyncProductCatalogRoute(app);
  registerSyncAllProductCatalogRoute(app);
  registerGetProductCatalogReadModelRoute(app);
}