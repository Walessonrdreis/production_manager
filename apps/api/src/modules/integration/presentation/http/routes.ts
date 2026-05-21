import type { FastifyInstance } from "fastify";
import { createProductionOrderController } from "./controllers";
import {
  CreateProductionOrderRequestSchema,
  CreateProductionOrderResponseSchema,
  ValidationErrorResponseSchema,
  InternalErrorResponseSchema,
} from "./schemas";

export async function integrationRoutes(app: FastifyInstance) {
  // POST /v1/integration/production-order
  app.route({
    method: "POST",
    url: "/v1/integration/production-order",
    schema: {
      description: "Mock endpoint for production order integration (API 1)",
      tags: ["integration"],
      body: CreateProductionOrderRequestSchema,
      response: {
        202: CreateProductionOrderResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
    },
    handler: createProductionOrderController,
  });
}