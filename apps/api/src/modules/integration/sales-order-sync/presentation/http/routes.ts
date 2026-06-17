import type { FastifyInstance } from "fastify";
import { registerSyncAllSalesOrdersRoute } from "./routes/commands/sync-all-sales-orders.route";
import { registerGetSalesOrderSyncStatusRoute } from "./routes/read/get-sales-order-sync-status.route";

export async function salesOrderSyncRoutes(app: FastifyInstance) {
  await registerSyncAllSalesOrdersRoute(app);
  await registerGetSalesOrderSyncStatusRoute(app);
}