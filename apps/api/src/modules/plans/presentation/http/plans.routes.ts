import { FastifyInstance } from "fastify";
import { markDeprecated } from "@/shared/http/response";

export async function registerPlansRoutes(app: FastifyInstance, controller: any) {
  app.post("/v1/admin/plans", controller.create);
  app.get("/v1/admin/plans", controller.list);
  app.get("/v1/admin/plans/:id", controller.getById);
  app.post("/v1/admin/plans/:id/items", controller.addItem);
  app.get("/v1/admin/plans/:id/by-sector", controller.listBySector);
  app.get("/v1/admin/plans/:id/export.csv", controller.exportCsv);

  app.post("/v1/plans", (req, rep) => {
    markDeprecated(req, rep, "/v1/plans (POST)", "/v1/admin/plans (POST)");
    return controller.create(req, rep);
  });

  app.get("/v1/plans", (req, rep) => {
    markDeprecated(req, rep, "/v1/plans (GET)", "/v1/admin/plans (GET)");
    return controller.list(req, rep);
  });

  app.get("/v1/plans/:id", (req, rep) => {
    markDeprecated(req, rep, "/v1/plans/:id (GET)", "/v1/admin/plans/:id (GET)");
    return controller.getById(req, rep);
  });

  app.post("/v1/plans/:id/items", (req, rep) => {
    markDeprecated(req, rep, "/v1/plans/:id/items (POST)", "/v1/admin/plans/:id/items (POST)");
    return controller.addItem(req, rep);
  });

  app.get("/v1/plans/:id/by-sector", (req, rep) => {
    markDeprecated(req, rep, "/v1/plans/:id/by-sector (GET)", "/v1/admin/plans/:id/by-sector (GET)");
    return controller.listBySector(req, rep);
  });

  app.get("/v1/plans/:id/export.csv", (req, rep) => {
    markDeprecated(req, rep, "/v1/plans/:id/export.csv (GET)", "/v1/admin/plans/:id/export.csv (GET)");
    return controller.exportCsv(req, rep);
  });
}