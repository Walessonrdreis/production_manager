import type { FastifyInstance } from "fastify";
import { createProductionOrderController } from "./controllers";

export async function integrationRoutes(app: FastifyInstance) {
  // POST /v1/integration/production-order
  app.route({
    method: "POST",
    url: "/v1/integration/production-order",
    schema: {
      description: "Mock endpoint for production order integration (API 1)",
      tags: ["integration"]
    },
    handler: createProductionOrderController,
  });
}