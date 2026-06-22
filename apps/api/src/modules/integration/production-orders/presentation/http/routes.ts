import type { FastifyInstance } from "fastify";

import { createProductionOrderController } from "./controllers/create-production-order.controller";
import { getProductionOrderStatusController } from "./controllers/get-production-order-status.controller";
import { confirmProductionOrderController } from "./controllers/confirm-production-order.controller";
import { failProductionOrderController } from "./controllers/fail-production-order.controller";

export async function productionOrdersIntegrationRoutes(app: FastifyInstance) {
  const schema = { tags: ["integration"] };

  // CREATE
  app.post("/v1/integration/production-order", {
    schema: { ...schema, description: "Create production order (integration)" },
    handler: createProductionOrderController,
  });

  // STATUS
  app.get("/v1/integration/production-order/:externalRequestId", {
    schema: { ...schema, description: "Get production order integration status" },
    handler: getProductionOrderStatusController,
  });

  // FAKE — CONFIRM
  app.post("/v1/integration/production-order/:externalRequestId/confirm", {
    schema: { ...schema, description: "FAKE – confirm production order" },
    handler: confirmProductionOrderController,
  });

  // FAKE — FAIL
  app.post("/v1/integration/production-order/:externalRequestId/fail", {
    schema: { ...schema, description: "FAKE – fail production order" },
    handler: failProductionOrderController,
  });
}