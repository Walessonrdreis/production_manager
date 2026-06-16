import type { FastifyInstance } from "fastify";

import { registerSyncProductCatalogRoute } from "./routes/commands/sync-product-catalog.route";
import { registerSyncAllProductCatalogRoute } from "./routes/commands/sync-all-product-catalog.route";
import { registerGetProductCatalogReadModelRoute } from "./routes/read/get-product-catalog-read-model.route";
import { registerGetProductCatalogSyncStatusRoute } from "./routes/read/get-product-catalog-sync-status.route";
import { registerGetProductCatalogSyncHistoryRoute } from "./routes/read/get-product-catalog-sync-history.route";
import { registerGetProductCatalogSyncFailuresRoute } from "./routes/read/get-product-catalog-sync-failures.route";
import { registerGetProductCatalogStatsRoute } from "./routes/read/get-product-catalog-stats.route";
import { registerGetProductCatalogLastSyncRoute } from "./routes/read/get-product-catalog-last-sync.route";

export async function productCatalogIntegrationRoutes(app: FastifyInstance) {
  registerSyncProductCatalogRoute(app);
  registerSyncAllProductCatalogRoute(app);
  registerGetProductCatalogReadModelRoute(app);
  registerGetProductCatalogSyncStatusRoute(app);
  registerGetProductCatalogSyncHistoryRoute(app);
  registerGetProductCatalogSyncFailuresRoute(app);
  registerGetProductCatalogStatsRoute(app);
  registerGetProductCatalogLastSyncRoute(app);
}