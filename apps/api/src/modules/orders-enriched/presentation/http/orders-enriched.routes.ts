// File: apps/api/src/modules/orders-enriched/presentation/http/orders-enriched.routes.ts

import { FastifyInstance } from "fastify";
import { OrdersEnrichedController } from "./orders-enriched.controller";
import { listStage20OrdersEnrichedSchema } from "./orders-enriched.schemas";

export async function ordersEnrichedRoutes(app: FastifyInstance) {
  const controller = new OrdersEnrichedController();

  app.get(
    "/admin/orders/stage20/enriched",
    { schema: listStage20OrdersEnrichedSchema },
    controller.listStage20Enriched.bind(controller)
  );
}
