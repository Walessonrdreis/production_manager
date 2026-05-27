import type { FastifyInstance } from "fastify";
import { createProductionOrderController } from "./controllers/create-production-order.controller";

export async function productionOrdersIntegrationRoutes(
  app: FastifyInstance
) {
  app.route({
    method: "POST",
    url: "/v1/integration/production-order",
    schema: {
      description: "Create production order (Omie integration)",
      tags: ["integration"],
    },
    handler: createProductionOrderController,
  });
}