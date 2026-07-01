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
import { registerRetryFailedRoute } from "./routes/commands/retry-failed.route";
import { registerSyncIncrementalRoute } from "./routes/commands/sync-incremental.route";
import { registerReconcileRoute } from "./routes/commands/reconcile.route";
import { registerInvalidateRoute } from "./routes/commands/invalidate.route";
import { registerRebuildRoute } from "./routes/commands/rebuild.route";
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
import { registerListUnifiedProductionOrdersRoute } from "./routes/read/list-unified-production-orders.route";
import { registerGetProductionOrderSummaryRoute } from "./routes/read/get-production-order-summary.route";
import { registerGetConsumptionSummaryRoute } from "./routes/read/get-consumption-summary.route";
import { registerGetProductionOrderSummaryByIdRoute } from "./routes/read/get-production-order-summary-by-id.route";
import { registerGetConsumptionSummaryByIdRoute } from "./routes/read/get-consumption-summary-by-id.route";
import { registerGetStockIssuesRoute } from "./routes/read/get-stock-issues.route";
import { registerGetProductionOrderByNumberRoute } from "./routes/read/get-production-order-by-number.route";
import { registerListProductionOrderCommandsRoute } from "./routes/read/list-production-order-commands.route";
import { registerGetSyncStateRoute } from "./routes/read/get-sync-state.route";
import { registerSearchSuggestionsRoute } from "./routes/read/search-suggestions.route";
import { registerRefreshProductionOrderReadModelRoute } from "./routes/admin/refresh-production-order-read-model.route";

export async function productionOrdersIntegrationRoutes(app: FastifyInstance) {
  // ─── Commands (intenções) ─────────────────────────────────────────
  await registerCreateProductionOrderRoute(app);
  await registerUpdateProductionOrderRoute(app);
  await registerCancelProductionOrderRoute(app);
  await registerChangeProductionOrderStageRoute(app);
  await registerSyncAllProductionOrdersRoute(app);

  // ─── Commands (C1-P0) ─────────────────────────────────────────────
  await registerRetryFailedRoute(app);
  await registerSyncIncrementalRoute(app);

  // ─── Commands (C3) ────────────────────────────────────────────────
  await registerReconcileRoute(app);
  await registerInvalidateRoute(app);
  await registerRebuildRoute(app);

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

  // ─── Read-Model (lista unificada com filtros — C1-P0) ─────────────
  await registerListUnifiedProductionOrdersRoute(app);

  // ─── Read-Model (summary para dashboard — C1-P0) ──────────────────
  await registerGetProductionOrderSummaryRoute(app);

  // ─── Read-Model (consumo agregado de materiais — C1-P0) ───────────
  await registerGetConsumptionSummaryRoute(app);

  // ─── Read-Model (summary por OP — C1.2 spec v2) ──────────────────
  await registerGetProductionOrderSummaryByIdRoute(app);

  // ─── Read-Model (consumption por OP — C1.3 spec v2) ──────────────
  await registerGetConsumptionSummaryByIdRoute(app);

  // ─── Read-Model (OPs com problemas de estoque — C2) ─────────────
  await registerGetStockIssuesRoute(app);

  // ─── Read-Model (consulta por número da OP — C2) ─────────────────
  await registerGetProductionOrderByNumberRoute(app);

  // ─── Read-Model (histórico de comandos — C2) ────────────────────
  await registerListProductionOrderCommandsRoute(app);

  // ─── Read-Model (estado de sincronização — C3) ──────────────────
  await registerGetSyncStateRoute(app);

  // ─── Read-Model (autocomplete — barra de busca) ──────────────────
  await registerSearchSuggestionsRoute(app);

  // ─── Admin (refresh do read model) ────────────────────────────────
  await registerRefreshProductionOrderReadModelRoute(app);
}