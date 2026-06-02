import type { FastifyInstance, FastifySchema } from "fastify";
import type { PrismaClient } from "@prisma/client";
import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";

import { createProductionOrderController } from "./controllers/create-production-order.controller";
import { getProductionOrderStatusController } from "./controllers/get-production-order-status.controller";
import { confirmProductionOrderController } from "./controllers/confirm-production-order.controller";
import { failProductionOrderController } from "./controllers/fail-production-order.controller";

export async function productionOrdersIntegrationRoutes(app: FastifyInstance) {
  const prisma = (app as any).prisma as PrismaClient;
  const omieClient = (app as any).omieClient as OmieHttpClientPort;

  const baseSchema = {
    tags: ["integration"],
    prisma,
    omieClient,
  } as FastifySchema & { prisma: PrismaClient; omieClient: OmieHttpClientPort };

  // CREATE
  app.route({
    method: "POST",
    url: "/v1/integration/production-order",
    schema: {
      ...baseSchema,
      description: "Create production order (integration)",
    },
    handler: createProductionOrderController,
  });

  // STATUS
  app.route({
    method: "GET",
    url: "/v1/integration/production-order/:externalRequestId",
    schema: {
      ...baseSchema,
      description: "Get production order integration status",
    },
    handler: getProductionOrderStatusController,
  });

  // ✅ FAKE — CONFIRM
  app.route({
    method: "POST",
    url: "/v1/integration/production-order/:externalRequestId/confirm",
    schema: {
      ...baseSchema,
      description: "FAKE – confirm production order",
    },
    handler: confirmProductionOrderController,
  });

  // ✅ FAKE — FAIL
  app.route({
    method: "POST",
    url: "/v1/integration/production-order/:externalRequestId/fail",
    schema: {
      ...baseSchema,
      description: "FAKE – fail production order",
    },
    handler: failProductionOrderController,
  });
}