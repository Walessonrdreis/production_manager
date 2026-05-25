import { FastifyInstance } from "fastify";
import { OrdersViewController } from "./orders-view.controller";

export async function ordersViewRoutes(app: FastifyInstance) {
  const controller = new OrdersViewController();

  // ✅ endpoint público
  app.get("/orders", controller.list.bind(controller));
}
