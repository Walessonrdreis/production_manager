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
import { registerListProductionOrdersRoute } from "./routes/read/list-production-orders.route";
import { registerGetProductionOrderRoute } from "./routes/read/get-production-order.route";
import { registerGetProductionOrderStatsRoute } from "./routes/read/get-production-order-stats.route";
import { registerGetQueueStatusRoute } from "./routes/read/get-queue-status.route";
import { registerGetQueueFailuresRoute } from "./routes/read/get-queue-failures.route";

export async function productionOrdersIntegrationRoutes(app: FastifyInstance) {
  await registerCreateProductionOrderRoute(app);
  await registerGetProductionOrderStatusRoute(app);
  await registerConfirmProductionOrderRoute(app);
  await registerFailProductionOrderRoute(app);
  await registerSyncAllProductionOrdersRoute(app);

  // Read-Models (espelho local + fila)
  await registerListProductionOrdersRoute(app);
  await registerGetProductionOrderRoute(app);
  await registerGetProductionOrderStatsRoute(app);
  await registerGetQueueStatusRoute(app);
  await registerGetQueueFailuresRoute(app);
}