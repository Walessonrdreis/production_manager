import { FastifyInstance } from "fastify";

export async function registerOmieSalesOrdersRoutes(app: FastifyInstance, controller: any) {
  // lista geral
  app.get("/v1/admin/orders", controller.listOrders);

  // stage 20
  app.get("/v1/admin/orders/stage20", controller.listStage20);
  app.get("/v1/admin/orders/stage20/totals", controller.getStage20Totals);
  app.get("/v1/admin/orders/stage20/totals/detailed", controller.getStage20TotalsDetailed);

  // omie stage20 controls
  app.post("/v1/admin/omie/orders/stage20/sync", controller.syncStage20);
  app.get("/v1/admin/omie/orders/stage20/sync", controller.syncStage20Info);
  app.get("/v1/admin/omie/orders/stage20/ping", controller.ping);
}