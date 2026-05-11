import { FastifyInstance } from "fastify";
import { StockAlertsController } from "./stock-alerts.controller";
import {
  StockAlertsRequestSchema,
  AlertConfigRequestSchema,
  AlertStatusRequestSchema,
} from "../../application/dtos/stock-alerts.dto";

export function registerStockAlertsRoutes(
  fastify: FastifyInstance,
  controller: StockAlertsController
) {
  fastify.get(
    "/api/alerts/stock",
    {
      schema: {
        description: "Listar alertas de estoque com filtros",
        tags: ["alerts"],
        querystring: {
          type: "object",
          properties: {
            page: { type: "number", minimum: 1, default: 1 },
            pageSize: { type: "number", minimum: 1, maximum: 100, default: 20 },
            severity: { type: "string", enum: ["critical", "warning", "info"] },
            resolved: { type: "boolean" },
            productCode: { type: "string" },
            dateFrom: { type: "string", format: "date-time" },
            dateTo: { type: "string", format: "date-time" },
          },
          additionalProperties: false
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  alerts: { type: "array" },
                  total: { type: "number" },
                  page: { type: "number" },
                  pageSize: { type: "number" },
                  statistics: {
                    type: "object",
                    properties: {
                      critical: { type: "number" },
                      warning: { type: "number" },
                      info: { type: "number" },
                      active: { type: "number" },
                      resolved: { type: "number" },
                      acknowledged: { type: "number" },
                    },
                  },
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
              details: { type: "string" },
            },
          },
          500: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              error: { type: "string" },
            },
          },
        },
      },
    },
    controller.listStockAlerts.bind(controller)
  );

  fastify.get(
    "/api/alerts/stock/critical",
    {
      schema: {
        description: "Listar alertas críticos de estoque",
        tags: ["alerts"],
        querystring: {
          type: "object",
          properties: {
            page: { type: "number", minimum: 1, default: 1 },
            pageSize: { type: "number", minimum: 1, maximum: 100, default: 20 },
            severity: { type: "string", enum: ["critical", "warning", "info"] },
            resolved: { type: "boolean" },
            productCode: { type: "string" },
            dateFrom: { type: "string", format: "date-time" },
            dateTo: { type: "string", format: "date-time" },
          },
          additionalProperties: false
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  alerts: { type: "array" },
                  total: { type: "number" },
                  page: { type: "number" },
                  pageSize: { type: "number" },
                  statistics: {
                    type: "object",
                    properties: {
                      critical: { type: "number" },
                      warning: { type: "number" },
                      info: { type: "number" },
                      active: { type: "number" },
                      resolved: { type: "number" },
                      acknowledged: { type: "number" },
                    },
                  },
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
              details: { type: "string" },
            },
          },
          500: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              error: { type: "string" },
            },
          },
        },
      },
    },
    controller.listCriticalStockAlerts.bind(controller)
  );

  fastify.post(
    "/api/alerts/stock/configure",
    {
      schema: {
        description: "Configurar regras de alertas de estoque",
        tags: ["alerts"],
        body: {
          type: "object",
          properties: {
            productCode: { type: "string" },
            criticalThreshold: { type: "number", minimum: 0 },
            warningThreshold: { type: "number", minimum: 0 },
            notificationChannels: { 
              type: "array", 
              items: { type: "string", enum: ["email", "sms", "dashboard"] } 
            },
            autoResolveDays: { type: "number", minimum: 1 },
          },
          additionalProperties: false
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  productCode: { type: "string" },
                  minimumStock: { type: "number" },
                  warningThreshold: { type: "number" },
                  criticalThreshold: { type: "number" },
                  notificationChannels: { type: "array", items: { type: "string" } },
                  enabled: { type: "boolean" },
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
              details: { type: "string" },
            },
          },
          500: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              error: { type: "string" },
            },
          },
        },
      },
    },
    controller.configureAlerts.bind(controller)
  );

  fastify.patch(
    "/api/alerts/stock/:id/status",
    {
      schema: {
        description: "Atualizar status de um alerta de estoque",
        tags: ["alerts"],
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
          required: ["id"],
        },
        body: {
          type: "object",
          properties: {
            status: { type: "string", enum: ["resolved", "acknowledged"] },
            notes: { type: "string" },
          },
          required: ["status"],
          additionalProperties: false
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  status: { type: "string" },
                  resolvedAt: { type: "string", format: "date-time" },
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
              details: { type: "string" },
            },
          },
          404: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              error: { type: "string" },
            },
          },
          500: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              error: { type: "string" },
            },
          },
        },
      },
    },
    controller.updateAlertStatus.bind(controller)
  );

  fastify.get(
    "/api/alerts/stock/statistics",
    {
      schema: {
        description: "Obter estatísticas de alertas de estoque",
        tags: ["alerts"],
        querystring: {
          type: "object",
          properties: {
            page: { type: "number", minimum: 1, default: 1 },
            pageSize: { type: "number", minimum: 1, maximum: 100, default: 20 },
            severity: { type: "string", enum: ["critical", "warning", "info"] },
            resolved: { type: "boolean" },
            productCode: { type: "string" },
            dateFrom: { type: "string", format: "date-time" },
            dateTo: { type: "string", format: "date-time" },
          },
          additionalProperties: false
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  total: { type: "number" },
                  critical: { type: "number" },
                  warning: { type: "number" },
                  info: { type: "number" },
                  active: { type: "number" },
                  resolved: { type: "number" },
                  acknowledged: { type: "number" },
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
              details: { type: "string" },
            },
          },
          500: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              error: { type: "string" },
            },
          },
        },
      },
    },
    controller.getAlertStatistics.bind(controller)
  );
}