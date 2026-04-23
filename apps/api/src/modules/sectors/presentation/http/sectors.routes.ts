import { FastifyInstance } from "fastify";
import { markDeprecated } from "@/shared/http/response";

export async function registerSectorsRoutes(app: FastifyInstance, controller: any) {
  app.post("/v1/admin/sectors", controller.create);
  app.get("/v1/admin/sectors", controller.list);
  app.patch("/v1/admin/sectors/:id", controller.update);
  app.delete("/v1/admin/sectors/:id", controller.remove);

  app.post("/v1/sectors", async (req, rep) => {
    markDeprecated(req, rep, "/v1/sectors (POST)", "/v1/admin/sectors (POST)");
    return controller.create(req, rep);
  });

  app.get("/v1/sectors", async (req, rep) => {
    markDeprecated(req, rep, "/v1/sectors (GET)", "/v1/admin/sectors (GET)");
    return controller.list(req, rep);
  });

  app.patch("/v1/sectors/:id", async (req, rep) => {
    markDeprecated(req, rep, "/v1/sectors/:id (PATCH)", "/v1/admin/sectors/:id (PATCH)");
    return controller.update(req, rep);
  });

  app.delete("/v1/sectors/:id", async (req, rep) => {
    markDeprecated(req, rep, "/v1/sectors/:id (DELETE)", "/v1/admin/sectors/:id (DELETE)");
    return controller.remove(req, rep);
  });
}