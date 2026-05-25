import { FastifyInstance } from "fastify";

export async function registerOmieProductionOrdersRoutes(app: FastifyInstance, controller: any) {
  // Lista geral de ordens de produção
  app.get("/v1/admin/omie/production-orders", controller.listProductionOrders);

  // Detalhe por código Omie
  app.get("/v1/admin/omie/production-orders/:omieCode", controller.getProductionOrderByCode);

  // Busca por código do produto
  app.get("/v1/admin/omie/production-orders/product/:productCode", controller.getProductionOrdersByProductCode);

  // Busca por código de integração do produto
  app.get("/v1/admin/omie/production-orders/product-integration/:integrationCode", controller.getProductionOrdersByProductIntegrationCode);

  // Estatísticas
  app.get("/v1/admin/omie/production-orders/stats", controller.getProductionOrdersStats);
  app.get("/v1/admin/omie/production-orders/stats/active", controller.getActiveProductionOrdersCount);
  app.get("/v1/admin/omie/production-orders/stats/completed", controller.getCompletedProductionOrdersCount);

  // Sincronização
  app.post("/v1/admin/omie/production-orders/sync", controller.syncProductionOrders);
  app.get("/v1/admin/omie/production-orders/sync", controller.syncProductionOrdersInfo);
  app.get("/v1/admin/omie/production-orders/ping", controller.ping);
}