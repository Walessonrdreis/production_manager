import type { FastifyInstance } from "fastify";
import { registerSyncAllSalesOrdersRoute } from "./routes/commands/sync-all-sales-orders.route";
import { registerGetSalesOrderSyncStatusRoute } from "./routes/read/get-sales-order-sync-status.route";
import { registerGetSalesOrderSummaryRoutes } from "./routes/read/get-sales-order-summary.route";
import { registerGetSalesOrderTransitionsRoutes } from "./routes/read/get-sales-order-transitions.route";

export async function salesOrderSyncRoutes(app: FastifyInstance) {
  await registerSyncAllSalesOrdersRoute(app);
  await registerGetSalesOrderSyncStatusRoute(app);
  await registerGetSalesOrderSummaryRoutes(app);
  await registerGetSalesOrderTransitionsRoutes(app);
}