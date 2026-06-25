// ---------------------------------------------------------------------------
// Routes — Production Orders Integration
// ---------------------------------------------------------------------------
// Commands  → routes/commands/   (intenções que saem do sistema)
// Callbacks → routes/callbacks/  (respostas que entram no sistema)
// Read-only → routes/read/       (consultas do espelho local)
// ---------------------------------------------------------------------------

import type { FastifyInstance } from "fastify";

import { registerCreateProductionOrderRoute } from "./routes/commands/create-production-order.route";
import { registerUpdateProductionOrderRoute } from "./routes/commands/update-production-order.route";
import { registerCancelProductionOrderRoute } from "./routes/commands/cancel-production-order.route";
import { registerChangeProductionOrderStageRoute } from "./routes/commands/change-production-order-stage.route";
import { registerSyncAllProductionOrdersRoute } from "./routes/commands/sync-all-production-orders.route";
import { registerGetProductionOrderStatusRoute } from "./routes/commands/get-production-order-status.route";

import { registerConfirmProductionOrderCallbackRoute } from "./routes/callbacks/confirm-production-order.callback.route";
import { registerFailProductionOrderCallbackRoute } from "./routes/callbacks/fail-production-order.callback.route";

import { registerListProductionOrdersRoute } from "./routes/read/list-production-orders.route";
import { registerGetProductionOrderRoute } from "./routes/read/get-production-order.route";
import { registerGetProductionOrderStatsRoute } from "./routes/read/get-production-order-stats.route";
import { registerGetQueueStatusRoute } from "./routes/read/get-queue-status.route";
import { registerGetQueueFailuresRoute } from "./routes/read/get-queue-failures.route";
import { registerGetProductionOrderRefreshRoute } from "./routes/read/get-production-order-refresh.route";
import { registerGetProductionOrderWithBomRoute } from "./routes/read/get-production-order-with-bom.route";
import { registerListOpenProductionOrdersRoute } from "./routes/read/list-open-production-orders.route";
import { registerRefreshProductionOrderReadModelRoute } from "./routes/admin/refresh-production-order-read-model.route";

export async function productionOrdersIntegrationRoutes(app: FastifyInstance) {
  // ─── Commands (intenções) ─────────────────────────────────────────
  await registerCreateProductionOrderRoute(app);
  await registerUpdateProductionOrderRoute(app);
  await registerCancelProductionOrderRoute(app);
  await registerChangeProductionOrderStageRoute(app);
  await registerSyncAllProductionOrdersRoute(app);

  // ─── Callbacks (respostas) ────────────────────────────────────────
  await registerConfirmProductionOrderCallbackRoute(app);
  await registerFailProductionOrderCallbackRoute(app);

  // ─── Tracking (status de comando) ─────────────────────────────────
  await registerGetProductionOrderStatusRoute(app);

  // ─── Read-Models (espelho local + fila) ───────────────────────────
  await registerListProductionOrdersRoute(app);
  await registerGetProductionOrderRoute(app);
  await registerGetProductionOrderStatsRoute(app);
  await registerGetQueueStatusRoute(app);
  await registerGetQueueFailuresRoute(app);

  // ─── Refresh (consulta Omie + atualiza espelho) ───────────────────
  await registerGetProductionOrderRefreshRoute(app);

  // ─── BOM Consumption (detalhe + estrutura) ────────────────────────
  await registerGetProductionOrderWithBomRoute(app);

  // ─── Read-Model (listagem de OPs abertas) ─────────────────────────
  await registerListOpenProductionOrdersRoute(app);

  // ─── Admin (refresh do read model) ────────────────────────────────
  await registerRefreshProductionOrderReadModelRoute(app);
}