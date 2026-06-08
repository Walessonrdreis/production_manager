import type { FastifyInstance } from "fastify";
import { registerProductStructureRoutes } from "./routes/index";

export async function productStructureIntegrationRoutes(app: FastifyInstance) {
  registerProductStructureRoutes(app);
}