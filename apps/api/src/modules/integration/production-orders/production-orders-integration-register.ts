import type { FastifyInstance } from "fastify";
import { productionOrdersIntegrationRoutes } from "./presentation/http/routes";

export async function registerProductionOrdersIntegrationModule(
  app: FastifyInstance
) {
  await app.register(productionOrdersIntegrationRoutes);
}
