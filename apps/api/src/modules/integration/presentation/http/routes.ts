import type { FastifyInstance } from "fastify";
import { createProductionOrderController } from "./controllers";
import { getStockPositionController } from "../../stock/presentation/http/stock-position.controller";

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
  
app.route({
  method: "POST",
  url: "/v1/integration/stock/position",
  schema: {
    description: "Get consolidated stock position by product (API 1)",
    tags: ["integration", "stock"]
  },
  handler: getStockPositionController
});

}