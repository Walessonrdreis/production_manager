import type { FastifyInstance } from "fastify";

import { registerGetProductionReadinessRoute } from "./read/get-production-readiness.route";
import { registerSyncProductStructureRoute } from "./commands/sync-product-structure.route";
import { registerApplyProductStructureRoute } from "./commands/apply-product-structure.route";
import { registerSubmitProductStructureRoute } from "./commands/submit-product-structure.route";
import { registerDeleteProductStructureRoute } from "./commands/delete-product-structure.route";

export function registerProductStructureRoutes(app: FastifyInstance) {
  registerGetProductionReadinessRoute(app);

  registerSyncProductStructureRoute(app);
  registerApplyProductStructureRoute(app);
  registerSubmitProductStructureRoute(app);
  registerDeleteProductStructureRoute(app);
}