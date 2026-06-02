import type { FastifyInstance } from "fastify";
import { productStructureIntegrationRoutes } from "./presentation/http/routes";

export async function registerProductStructureIntegrationModule(app: FastifyInstance) {
  await app.register(productStructureIntegrationRoutes);
}