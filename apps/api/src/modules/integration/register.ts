import type { FastifyInstance } from "fastify";
import { integrationRoutes } from "./presentation/http/routes";

export async function registerIntegrationModule(app: FastifyInstance) {
  await app.register(integrationRoutes);
}