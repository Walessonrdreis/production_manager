// ---------------------------------------------------------------------------
// Routes — Production Orders Integration
// ---------------------------------------------------------------------------
// Commands  → routes/commands/
// Read-only → routes/read/
// ---------------------------------------------------------------------------

import type { FastifyInstance } from "fastify";

import { registerCreateProductionOrderRoute } from "./routes/commands/create-production-order.route";
import { registerConfirmProductionOrderRoute } from "./routes/commands/confirm-production-order.route";
import { registerFailProductionOrderRoute } from "./routes/commands/fail-production-order.route";
import { registerSyncAllProductionOrdersRoute } from "./routes/commands/sync-all-production-orders.route";
import { registerGetProductionOrderStatusRoute } from "./routes/read/get-production-order-status.route";

export async function productionOrdersIntegrationRoutes(app: FastifyInstance) {
  await registerCreateProductionOrderRoute(app);
  await registerGetProductionOrderStatusRoute(app);
  await registerConfirmProductionOrderRoute(app);
  await registerFailProductionOrderRoute(app);
  await registerSyncAllProductionOrdersRoute(app);
}