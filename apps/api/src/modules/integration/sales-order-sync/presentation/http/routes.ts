import type { FastifyInstance } from "fastify";

// ─── Commands (intenções) ─────────────────────────────────────────
import { registerSyncAllSalesOrdersRoute } from "./routes/commands/sync-all-sales-orders.route";

// ─── Callbacks (respostas) ────────────────────────────────────────
import { registerConfirmSalesOrderSyncCallbackRoute } from "./routes/callbacks/confirm-sales-order-sync.callback.route";
import { registerFailSalesOrderSyncCallbackRoute } from "./routes/callbacks/fail-sales-order-sync.callback.route";

// ─── Read-Models (espelho local) ──────────────────────────────────
import { registerGetSalesOrderSyncStatusRoute } from "./routes/read/get-sales-order-sync-status.route";
import { registerGetSalesOrderSummaryRoutes } from "./routes/read/get-sales-order-summary.route";
import { registerGetSalesOrderTransitionsRoutes } from "./routes/read/get-sales-order-transitions.route";
import { registerGetSalesOrderByIdRoute } from "./routes/read/get-sales-order-by-id.route";
import { registerGetSalesOrdersOpenItemsRoute } from "./routes/read/get-sales-orders-open-items.route";
import { registerGetSalesOrderQueueRoute } from "./routes/read/get-sales-order-queue.route";
import { registerGetSalesOrderFailuresRoute } from "./routes/read/get-sales-order-failures.route";

export async function salesOrderSyncRoutes(app: FastifyInstance) {
  // ─── Commands ───────────────────────────────────────────────────
  await registerSyncAllSalesOrdersRoute(app);

  // ─── Callbacks ──────────────────────────────────────────────────
  await registerConfirmSalesOrderSyncCallbackRoute(app);
  await registerFailSalesOrderSyncCallbackRoute(app);

  // ─── Read-Models ────────────────────────────────────────────────
  await registerGetSalesOrderSyncStatusRoute(app);
  await registerGetSalesOrderSummaryRoutes(app);
  await registerGetSalesOrderTransitionsRoutes(app);
  await registerGetSalesOrderByIdRoute(app);
  await registerGetSalesOrdersOpenItemsRoute(app);
  await registerGetSalesOrderQueueRoute(app);
  await registerGetSalesOrderFailuresRoute(app);
}