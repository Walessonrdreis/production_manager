import { FastifyInstance } from "fastify";
import { markDeprecated } from "@/shared/http/response";

export async function registerProductSectorRoutes(app: FastifyInstance, controller: any) {
  app.put("/v1/admin/managed-products/:productId/sector", controller.setDefault);
  app.get("/v1/admin/managed-products/:productId/sector", controller.getDefault);

  app.put("/v1/admin/products/:productId/sector", async (req, rep) => {
    markDeprecated(req, rep,
      "/v1/admin/products/:productId/sector (PUT)",
      "/v1/admin/managed-products/:productId/sector (PUT)"
    );
    return controller.setDefault(req, rep);
  });

  app.get("/v1/admin/products/:productId/sector", async (req, rep) => {
    markDeprecated(req, rep,
      "/v1/admin/products/:productId/sector (GET)",
      "/v1/admin/managed-products/:productId/sector (GET)"
    );
    return controller.getDefault(req, rep);
  });

  app.put("/v1/products/:productId/sector", async (req, rep) => {
    markDeprecated(req, rep,
      "/v1/products/:productId/sector (PUT)",
      "/v1/admin/managed-products/:productId/sector (PUT)"
    );
    return controller.setDefault(req, rep);
  });

  app.get("/v1/products/:productId/sector", async (req, rep) => {
    markDeprecated(req, rep,
      "/v1/products/:productId/sector (GET)",
      "/v1/admin/managed-products/:productId/sector (GET)"
    );
    return controller.getDefault(req, rep);
  });
}