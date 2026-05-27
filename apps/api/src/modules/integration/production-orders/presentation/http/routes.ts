import type { FastifyInstance, FastifySchema } from "fastify";
import type { PrismaClient } from "@prisma/client";
import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";

import { createProductionOrderController } from "./controllers/create-production-order.controller";
import { getProductionOrderStatusController } from "./controllers/get-production-order-status.controller";

export async function productionOrdersIntegrationRoutes(app: FastifyInstance) {
  // ✅ Compat com o seu legado de tipagem (FastifySchema estendido)
  const prisma = (app as any).prisma as PrismaClient;
  const omieClient = (app as any).omieClient as OmieHttpClientPort;

  const baseSchema: FastifySchema = {
    tags: ["integration"],
    prisma,
    omieClient,
  };

  // POST /v1/integration/production-order
  app.route({
    method: "POST",
    url: "/v1/integration/production-order",
    schema: {
      ...baseSchema,
      description: "Create production order integration (API 1)",
    },
    handler: createProductionOrderController,
  });

  // ✅ NOVO: GET /v1/integration/production-order/:externalRequestId
  app.route({
    method: "GET",
    url: "/v1/integration/production-order/:externalRequestId",
    schema: {
      ...baseSchema,
      description: "Get production order integration status by externalRequestId",
    },
    handler: getProductionOrderStatusController,
  });
}