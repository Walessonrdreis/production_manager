import type { FastifyInstance } from "fastify";
import { productionOrdersIntegrationRoutes } from "./presentation/http/routes";

export function createProductionOrderIntegration() {
  return {
    name: "production-order-integration",
    register: async (app: FastifyInstance) => {
      await productionOrdersIntegrationRoutes(app);
    },
  };
}
