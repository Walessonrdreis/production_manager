import type { FastifyInstance } from "fastify";
import { getOrdersStage20Controller } from "./presentation/http/orders-stage20.controller";

export async function registerOrdersModule(app: FastifyInstance) {
  app.post("/v1/integration/orders/stage20", getOrdersStage20Controller);
}