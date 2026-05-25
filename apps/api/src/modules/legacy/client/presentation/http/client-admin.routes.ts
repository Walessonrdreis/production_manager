// File: apps/api/src/modules/client/presentation/http/client-admin.routes.ts

import { FastifyInstance } from "fastify";
import { ClientAdminController } from "./client-admin.controller";
import { syncClientsFromOmieSchema } from "./client-admin.schemas";

export async function clientAdminRoutes(app: FastifyInstance) {
  const controller = new ClientAdminController();

  app.post(
    "/admin/omie/clients/sync",
    { schema: syncClientsFromOmieSchema },
    controller.syncFromOmie.bind(controller)
  );
}