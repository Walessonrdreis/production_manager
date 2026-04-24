// src/modules/products/presentation/http/products.routes.ts
import type { FastifyInstance } from "fastify";
import { markDeprecated } from "@/shared/http/response";

export async function registerProductsRoutes(app: FastifyInstance, controller: any) {
  // ---------------------------------------------------------------------------
  // público
  // ---------------------------------------------------------------------------
  app.get("/v1/products", controller.publicList);
  app.get("/v1/products/:omieCode([A-Za-z0-9]{1,64})", controller.publicGetByOmieCode);

  // deprecated /v1/products/stock -> /v1/products
  app.get("/v1/products/stock", async (request, reply) => {
    markDeprecated(request, reply, "/v1/products/stock", "/v1/products");
    return controller.publicList(request, reply);
  });

  // ---------------------------------------------------------------------------
  // admin - managed-products
  // ---------------------------------------------------------------------------
  app.post("/v1/admin/managed-products", controller.createManagedProduct);

  // deprecated posts
  app.post("/v1/admin/products", async (request, reply) => {
    markDeprecated(request, reply, "/v1/admin/products (POST)", "/v1/admin/managed-products (POST)");
    return controller.createManagedProduct(request, reply);
  });
  app.post("/v1/products", async (request, reply) => {
    markDeprecated(request, reply, "/v1/products (POST)", "/v1/admin/managed-products (POST)");
    return controller.createManagedProduct(request, reply);
  });

  // bulk
  app.post("/v1/admin/managed-products/bulk", controller.createManagedProductsBulk);

  // deprecated bulk posts
  app.post("/v1/admin/products/bulk", async (request, reply) => {
    markDeprecated(request, reply, "/v1/admin/products/bulk (POST)", "/v1/admin/managed-products/bulk (POST)");
    return controller.createManagedProductsBulk(request, reply);
  });
  app.post("/v1/products/bulk", async (request, reply) => {
    markDeprecated(request, reply, "/v1/products/bulk (POST)", "/v1/admin/managed-products/bulk (POST)");
    return controller.createManagedProductsBulk(request, reply);
  });

  // list managed
  app.get("/v1/admin/managed-products", controller.listManagedProducts);

  // deprecated managed listing
  app.get("/v1/admin/products", async (request, reply) => {
    markDeprecated(request, reply, "/v1/admin/products (GET)", "/v1/admin/managed-products (GET)");
    return controller.listManagedProducts(request, reply);
  });
  app.get("/v1/products/managed", async (request, reply) => {
    markDeprecated(request, reply, "/v1/products/managed", "/v1/admin/managed-products");
    return controller.listManagedProducts(request, reply);
  });

  // get managed by id
  app.get("/v1/admin/managed-products/:id", controller.getManagedProduct);

  // deprecated get by id
  app.get("/v1/admin/products/:id", async (request, reply) => {
    markDeprecated(request, reply, "/v1/admin/products/:id (GET)", "/v1/admin/managed-products/:id (GET)");
    return controller.getManagedProduct(request, reply);
  });
  app.get("/v1/products/:id", async (request, reply) => {
    markDeprecated(request, reply, "/v1/products/:id", "/v1/admin/managed-products/:id");
    return controller.getManagedProduct(request, reply);
  });

  // patch managed
  app.patch("/v1/admin/managed-products/:id", controller.patchManagedProduct);

  // deprecated patch
  app.patch("/v1/admin/products/:id", async (request, reply) => {
    markDeprecated(request, reply, "/v1/admin/products/:id (PATCH)", "/v1/admin/managed-products/:id (PATCH)");
    return controller.patchManagedProduct(request, reply);
  });
  app.patch("/v1/products/:id", async (request, reply) => {
    markDeprecated(request, reply, "/v1/products/:id (PATCH)", "/v1/admin/managed-products/:id (PATCH)");
    return controller.patchManagedProduct(request, reply);
  });

  // delete managed
  app.delete("/v1/admin/managed-products/:id", controller.deleteManagedProduct);

  // deprecated delete
  app.delete("/v1/admin/products/:id", async (request, reply) => {
    markDeprecated(request, reply, "/v1/admin/products/:id (DELETE)", "/v1/admin/managed-products/:id (DELETE)");
    return controller.deleteManagedProduct(request, reply);
  });
  app.delete("/v1/products/:id", async (request, reply) => {
    markDeprecated(request, reply, "/v1/products/:id (DELETE)", "/v1/admin/managed-products/:id (DELETE)");
    return controller.deleteManagedProduct(request, reply);
  });

  // ---------------------------------------------------------------------------
  // stock (managed)
  // ---------------------------------------------------------------------------
  app.get("/v1/admin/managed-products/:id/stock", controller.getManagedProductStock);

  // deprecated stock
  app.get("/v1/admin/products/:id/stock", async (request, reply) => {
    markDeprecated(request, reply, "/v1/admin/products/:id/stock (GET)", "/v1/admin/managed-products/:id/stock (GET)");
    return controller.getManagedProductStock(request, reply);
  });
  app.get("/v1/products/:id/stock", async (request, reply) => {
    markDeprecated(request, reply, "/v1/products/:id/stock", "/v1/admin/managed-products/:id/stock");
    return controller.getManagedProductStock(request, reply);
  });

  // stock history
  app.get("/v1/admin/managed-products/:id/stock/history", controller.getManagedProductStockHistory);

  // deprecated stock history
  app.get("/v1/admin/products/:id/stock/history", async (request, reply) => {
    markDeprecated(
      request,
      reply,
      "/v1/admin/products/:id/stock/history (GET)",
      "/v1/admin/managed-products/:id/stock/history (GET)"
    );
    return controller.getManagedProductStockHistory(request, reply);
  });
  app.get("/v1/products/:id/stock/history", async (request, reply) => {
    markDeprecated(
      request,
      reply,
      "/v1/products/:id/stock/history",
      "/v1/admin/managed-products/:id/stock/history"
    );
    return controller.getManagedProductStockHistory(request, reply);
  });

  // ---------------------------------------------------------------------------
  // ✅ admin - omie (compat legacy)
  // ---------------------------------------------------------------------------

  // sync omie products (status + execute)
  app.get("/v1/admin/omie/sync/products", controller.syncOmieProductsInfo);
  app.post("/v1/admin/omie/sync/products", controller.syncOmieProducts);

  // catálogo omie (enriquecido com estoque)
  app.get("/v1/admin/omie/products", controller.adminOmieProductsList);

  // categorias/famílias
  app.get("/v1/admin/omie/categories", controller.adminOmieCategories);

  // search/autocomplete
  app.get("/v1/admin/omie/products/search", controller.adminOmieProductsSearch);

  // detalhe por uuid
  app.get("/v1/admin/omie/products/:id", controller.adminOmieProductById);

  // detalhe por código
  app.get("/v1/admin/omie/products/by-code/:omieCode", controller.adminOmieProductByCode);

  // estoque por uuid
  app.get("/v1/admin/omie/products/:id/stock", controller.adminOmieProductStockById);

  // estoque por código
  app.get("/v1/admin/omie/products/by-code/:omieCode/stock", controller.adminOmieProductStockByCode);

  // info do estoque persistido (db)
  app.get("/v1/admin/omie/stock", controller.adminOmieStockInfo);

  // refresh/persistência do estoque
  app.post("/v1/admin/omie/products/stock/refresh", controller.adminOmieStockRefresh);

  // ---------------------------------------------------------------------------
  // (opcional) deprecated /v1/omie/* -> /v1/admin/omie/*
  // Se você quiser manter 100% compat com legacy antigo, descomente:
  // ---------------------------------------------------------------------------
  
  app.get("/v1/omie/products", async (req, rep) => {
    markDeprecated(req, rep, "/v1/omie/products", "/v1/admin/omie/products");
    return controller.adminOmieProductsList(req, rep);
  });

  app.get("/v1/omie/categories", async (req, rep) => {
    markDeprecated(req, rep, "/v1/omie/categories", "/v1/admin/omie/categories");
    return controller.adminOmieCategories(req, rep);
  });

  app.get("/v1/omie/products/search", async (req, rep) => {
    markDeprecated(req, rep, "/v1/omie/products/search", "/v1/admin/omie/products/search");
    return controller.adminOmieProductsSearch(req, rep);
  });

  app.get("/v1/omie/stock", async (req, rep) => {
    markDeprecated(req, rep, "/v1/omie/stock", "/v1/admin/omie/stock");
    return controller.adminOmieStockInfo(req, rep);
  });

  app.post("/v1/omie/products/stock/refresh", async (req, rep) => {
    markDeprecated(req, rep, "/v1/omie/products/stock/refresh", "/v1/admin/omie/products/stock/refresh");
    return controller.adminOmieStockRefresh(req, rep);
  });

  app.get("/v1/omie/products/:id", async (req, rep) => {
    markDeprecated(req, rep, "/v1/omie/products/:id", "/v1/admin/omie/products/:id");
    return controller.adminOmieProductById(req, rep);
  });

  app.get("/v1/omie/products/by-code/:omieCode", async (req, rep) => {
    markDeprecated(req, rep, "/v1/omie/products/by-code/:omieCode", "/v1/admin/omie/products/by-code/:omieCode");
    return controller.adminOmieProductByCode(req, rep);
  });

  app.get("/v1/omie/products/:id/stock", async (req, rep) => {
    markDeprecated(req, rep, "/v1/omie/products/:id/stock", "/v1/admin/omie/products/:id/stock");
    return controller.adminOmieProductStockById(req, rep);
  });

  app.get("/v1/omie/products/by-code/:omieCode/stock", async (req, rep) => {
    markDeprecated(req, rep, "/v1/omie/products/by-code/:omieCode/stock", "/v1/admin/omie/products/by-code/:omieCode/stock");
    return controller.adminOmieProductStockByCode(req, rep);
  });
  
}