// src/modules/products/presentation/http/products.routes.ts
import { FastifyInstance } from "fastify";
import { markDeprecated } from "@/shared/http/response";

export async function registerProductsRoutes(app: FastifyInstance, controller: any) {
  // público
  app.get("/v1/products", controller.publicList);
  app.get("/v1/products/:omieCode([A-Za-z0-9]{1,64})", controller.publicGetByOmieCode);

  // deprecated /v1/products/stock -> /v1/products
  app.get("/v1/products/stock", async (request, reply) => {
    markDeprecated(request, reply, "/v1/products/stock", "/v1/products");
    return controller.publicList(request, reply);
  });

  // admin - managed-products
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
    markDeprecated(
      request,
      reply,
      "/v1/admin/products/bulk (POST)",
      "/v1/admin/managed-products/bulk (POST)"
    );
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
    markDeprecated(
      request,
      reply,
      "/v1/admin/products/:id (GET)",
      "/v1/admin/managed-products/:id (GET)"
    );
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
    markDeprecated(
      request,
      reply,
      "/v1/admin/products/:id (PATCH)",
      "/v1/admin/managed-products/:id (PATCH)"
    );
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
    markDeprecated(
      request,
      reply,
      "/v1/admin/products/:id (DELETE)",
      "/v1/admin/managed-products/:id (DELETE)"
    );
    return controller.deleteManagedProduct(request, reply);
  });
  app.delete("/v1/products/:id", async (request, reply) => {
    markDeprecated(request, reply, "/v1/products/:id (DELETE)", "/v1/admin/managed-products/:id (DELETE)");
    return controller.deleteManagedProduct(request, reply);
  });

  // stock
  app.get("/v1/admin/managed-products/:id/stock", controller.getManagedProductStock);

  // deprecated stock
  app.get("/v1/admin/products/:id/stock", async (request, reply) => {
    markDeprecated(
      request,
      reply,
      "/v1/admin/products/:id/stock (GET)",
      "/v1/admin/managed-products/:id/stock (GET)"
    );
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
}