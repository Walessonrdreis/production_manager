import type { FastifyInstance } from "fastify";
import { createProductionOrderController } from "./controllers";
import {
  CreateProductionOrderRequestSchema,
  CreateProductionOrderResponseSchema,
  ValidationErrorResponseSchema,
  InternalErrorResponseSchema,
} from "./schemas";
import { zodToJsonSchema } from "zod-to-json-schema";

export async function integrationRoutes(app: FastifyInstance) {
  // POST /v1/integration/production-order
  app.route({
    method: "POST",
    url: "/v1/integration/production-order",
    schema: {
      description: "Mock endpoint for production order integration (API 1)",
      tags: ["integration"],
      body: zodToJsonSchema(CreateProductionOrderRequestSchema),
      response: {
        202: zodToJsonSchema(CreateProductionOrderResponseSchema),
        400: zodToJsonSchema(ValidationErrorResponseSchema),
        500: zodToJsonSchema(InternalErrorResponseSchema),
      },
    },
    handler: createProductionOrderController,
  });
}