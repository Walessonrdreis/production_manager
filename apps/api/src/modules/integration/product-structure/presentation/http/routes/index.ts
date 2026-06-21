import type { FastifyInstance } from "fastify";

import { registerGetProductionReadinessRoute } from "./read/get-production-readiness.route";
import { registerGetProductStructureSyncStatusRoute } from "./read/get-product-structure-sync-status.route";
import { registerGetProductStructureSummaryRoute } from "./read/get-product-structure-summary.route";

import { registerSyncProductStructureRoute } from "./commands/sync-product-structure.route";
import { registerApplyProductStructureRoute } from "./commands/apply-product-structure.route";
import { registerSubmitProductStructureRoute } from "./commands/submit-product-structure.route";
import { registerDeleteProductStructureRoute } from "./commands/delete-product-structure.route";
import { registerSyncAllProductStructuresRoute } from "./commands/sync-all-product-structures.route";

export function registerProductStructureRoutes(app: FastifyInstance) {
  registerGetProductionReadinessRoute(app);
  registerGetProductStructureSyncStatusRoute(app);
  registerGetProductStructureSummaryRoute(app);

  registerSyncProductStructureRoute(app);
  registerSyncAllProductStructuresRoute(app);
  registerApplyProductStructureRoute(app);
  registerSubmitProductStructureRoute(app);
  registerDeleteProductStructureRoute(app);
}