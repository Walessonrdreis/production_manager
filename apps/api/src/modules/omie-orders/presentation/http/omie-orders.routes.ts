import { FastifyInstance } from "fastify";

export async function registerOmieOrdersRoutes(app: FastifyInstance, controller: any) {
  // lista geral
  app.get("/v1/admin/orders", controller.listOrders);

  // stage 20
  app.get("/v1/admin/orders/stage20", controller.listStage20);
  app.get("/v1/admin/orders/stage20/totals", controller.getStage20Totals);

  // omie stage20 controls
  app.post("/v1/admin/omie/orders/stage20/sync", controller.syncStage20);
  app.get("/v1/admin/omie/orders/stage20/sync", controller.syncStage20Info);
  app.get("/v1/admin/omie/orders/stage20/ping", controller.ping);
}