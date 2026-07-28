// ---------------------------------------------------------------------------
// Routes — Product Structure Integration
// ---------------------------------------------------------------------------
// Commands  → routes/commands/   (intenções que saem do sistema)
// Callbacks → routes/callbacks/  (respostas que entram no sistema)
// Read-only → routes/read/       (consultas do espelho local)
// ---------------------------------------------------------------------------

import type { FastifyInstance } from "fastify";

import { registerSyncProductStructureRoute } from "./routes/commands/sync-product-structure.route";
import { registerSyncAllProductStructuresRoute } from "./routes/commands/sync-all-product-structures.route";
import { registerApplyProductStructureRoute } from "./routes/commands/apply-product-structure.route";
import { registerSubmitProductStructureRoute } from "./routes/commands/submit-product-structure.route";
import { registerDeleteProductStructureRoute } from "./routes/commands/delete-product-structure.route";

import { registerConfirmProductStructureCallbackRoute } from "./routes/callbacks/confirm-product-structure.callback.route";
import { registerFailProductStructureCallbackRoute } from "./routes/callbacks/fail-product-structure.callback.route";

import { registerGetProductionReadinessRoute } from "./routes/read/get-production-readiness.route";
import { registerGetProductStructureSyncStatusRoute } from "./routes/read/get-product-structure-sync-status.route";
import { registerGetProductStructureSummaryRoute } from "./routes/read/get-product-structure-summary.route";
import { registerGetProductStructureRefreshRoute } from "./routes/read/get-product-structure-refresh.route";

export async function productStructureIntegrationRoutes(app: FastifyInstance) {
  // ─── Commands (intenções) ─────────────────────────────────────────
  await registerSyncProductStructureRoute(app);
  await registerSyncAllProductStructuresRoute(app);
  await registerApplyProductStructureRoute(app);
  await registerSubmitProductStructureRoute(app);
  await registerDeleteProductStructureRoute(app);

  // ─── Callbacks (respostas) ────────────────────────────────────────
  await registerConfirmProductStructureCallbackRoute(app);
  await registerFailProductStructureCallbackRoute(app);

  // ─── Read-Models (espelho local) ──────────────────────────────────
  await registerGetProductionReadinessRoute(app);
  await registerGetProductStructureSyncStatusRoute(app);
  await registerGetProductStructureSummaryRoute(app);

  // ─── Refresh (consulta Omie + atualiza espelho) ───────────────────
  await registerGetProductStructureRefreshRoute(app);
}