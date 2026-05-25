import type { FastifyInstance } from "fastify";
import { SalesProductionIntegrationController } from "./sales-production-integration.controller";

export function registerSalesProductionIntegrationRoutes(
  fastify: FastifyInstance,
  controller: SalesProductionIntegrationController
) {
  // POST /api/integration/sales-to-production
  fastify.post(
    "/api/integration/sales-to-production",
    {
      schema: {
        description: "Integrar pedido de venda à fila de produção automaticamente",
        tags: ["sales-production-integration"],
        body: {
          type: "object",
          required: ["orderId", "customerType", "orderValue"],
          properties: {
            orderId: { type: "string", format: "uuid" },
            customerType: { type: "string", enum: ["regular", "vip", "corporate"] },
            orderValue: { type: "number", minimum: 0 },
            deliveryDeadline: { type: "string", format: "date-time" },
            notes: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  id: { type: "string", format: "uuid" },
                  orderId: { type: "string", format: "uuid" },
                  priority: { type: "string", enum: ["high", "medium", "low"] },
                  status: { type: "string", enum: ["pending", "in_progress", "completed", "cancelled"] },
                  position: { type: "number" },
                  estimatedStartDate: { type: "string", format: "date-time" },
                  createdAt: { type: "string", format: "date-time" },
                  updatedAt: { type: "string", format: "date-time" },
                },
              },
              message: { type: "string" },
            },
          },
          400: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              error: { type: "string" },
              data: {
                type: "object",
                properties: {
                  id: { type: "string", format: "uuid" },
                  orderId: { type: "string", format: "uuid" },
                  priority: { type: "string", enum: ["high", "medium", "low"] },
                  status: { type: "string", enum: ["pending", "in_progress", "completed", "cancelled"] },
                  position: { type: "number" },
                  estimatedStartDate: { type: "string", format: "date-time" },
                  createdAt: { type: "string", format: "date-time" },
                  updatedAt: { type: "string", format: "date-time" },
                },
              },
            },
          },
        },
      },
    },
    controller.salesToProduction.bind(controller)
  );

  // GET /api/integration/sales-to-production/statistics
  fastify.get(
    "/api/integration/sales-to-production/statistics",
    {
      schema: {
        description: "Obter estatísticas da integração vendas→produção",
        tags: ["sales-production-integration"],
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  totalIntegrated: { type: "number" },
                  byPriority: {
                    type: "object",
                    properties: {
                      high: { type: "number" },
                      medium: { type: "number" },
                      low: { type: "number" },
                    },
                  },
                  byCustomerType: {
                    type: "object",
                    properties: {
                      regular: { type: "number" },
                      vip: { type: "number" },
                      corporate: { type: "number" },
                    },
                  },
                  averageIntegrationTime: { type: "number" },
                  lastIntegrationAt: { type: "string", format: "date-time" },
                },
              },
              message: { type: "string" },
            },
          },
        },
      },
    },
    controller.integrationStatistics.bind(controller)
  );
}