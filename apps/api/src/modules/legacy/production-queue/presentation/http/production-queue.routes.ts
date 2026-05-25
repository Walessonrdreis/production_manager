import { FastifyInstance } from "fastify";
import { ProductionQueueController } from "./production-queue.controller";
import {
  AddToQueueRequestSchema,
  ListQueueRequestSchema,
  UpdateQueueStatusRequestSchema,
  QueueStatisticsRequestSchema,
  ReorderQueueRequestSchema,
} from "../../application/dtos/production-queue.dto";

export function registerProductionQueueRoutes(
  fastify: FastifyInstance,
  controller: ProductionQueueController
) {
  // Adicionar ordem à fila
  fastify.post(
    "/api/production/queue/add",
    {
      schema: {
        description: "Adicionar ordem à fila de produção",
        tags: ["production-queue"],
        body: AddToQueueRequestSchema,
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
                  scheduledDate: { type: "string", format: "date-time" },
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
          404: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              error: { type: "string" },
            },
          },
          409: {
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
    controller.addToQueue.bind(controller)
  );

  // Listar fila de produção
  fastify.get(
    "/api/production/queue",
    {
      schema: {
        description: "Listar fila de produção com filtros",
        tags: ["production-queue"],
        querystring: ListQueueRequestSchema,
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string", format: "uuid" },
                        orderId: { type: "string", format: "uuid" },
                        orderNumber: { type: "string" },
                        clientName: { type: "string" },
                        totalItems: { type: "number" },
                        priority: { type: "string", enum: ["high", "medium", "low"] },
                        status: { type: "string", enum: ["pending", "in_progress", "completed", "cancelled"] },
                        position: { type: "number" },
                        estimatedStartDate: { type: "string", format: "date-time" },
                        scheduledDate: { type: "string", format: "date-time" },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
                      },
                    },
                  },
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
    controller.listQueue.bind(controller)
  );

  // Obter item específico da fila
  fastify.get(
    "/api/production/queue/:id",
    {
      schema: {
        description: "Obter detalhes de um item específico da fila",
        tags: ["production-queue"],
        params: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
          },
          required: ["id"],
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
                  orderNumber: { type: "string" },
                  clientName: { type: "string" },
                  totalItems: { type: "number" },
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
    controller.getQueueItem.bind(controller)
  );

  // Atualizar status da fila
  fastify.patch(
    "/api/production/queue/:id/status",
    {
      schema: {
        description: "Atualizar status de um item da fila",
        tags: ["production-queue"],
        params: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
          },
          required: ["id"],
        },
        body: UpdateQueueStatusRequestSchema,
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  id: { type: "string", format: "uuid" },
                  status: { type: "string", enum: ["pending", "in_progress", "completed", "cancelled"] },
                  updatedAt: { type: "string", format: "date-time" },
                  completedAt: { type: "string", format: "date-time" },
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
    controller.updateQueueStatus.bind(controller)
  );

  // Obter estatísticas da fila
  fastify.get(
    "/api/production/queue/statistics",
    {
      schema: {
        description: "Obter estatísticas da fila de produção",
        tags: ["production-queue"],
        querystring: QueueStatisticsRequestSchema,
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  totalOrders: { type: "number" },
                  pendingOrders: { type: "number" },
                  inProgressOrders: { type: "number" },
                  completedOrders: { type: "number" },
                  cancelledOrders: { type: "number" },
                  averageCompletionTime: { type: "number" },
                  priorityDistribution: {
                    type: "object",
                    properties: {
                      high: { type: "number" },
                      medium: { type: "number" },
                      low: { type: "number" },
                    },
                  },
                  dailyThroughput: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        date: { type: "string", format: "date" },
                        completed: { type: "number" },
                      },
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
    controller.getQueueStatistics.bind(controller)
  );

  // Reordenar fila
  fastify.post(
    "/api/production/queue/reorder",
    {
      schema: {
        description: "Reordenar itens da fila de produção",
        tags: ["production-queue"],
        body: ReorderQueueRequestSchema,
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  updatedItems: { type: "number" },
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
    controller.reorderQueue.bind(controller)
  );

  // Health check da fila
  fastify.get(
    "/api/production/queue/health",
    {
      schema: {
        description: "Verificar saúde da fila de produção",
        tags: ["production-queue"],
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  status: { type: "string" },
                  timestamp: { type: "string", format: "date-time" },
                  queueSize: { type: "number" },
                  pendingItems: { type: "number" },
                  inProgressItems: { type: "number" },
                },
              },
              message: { type: "string" },
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
    async (request, reply) => {
      try {
        // Em uma implementação real, faríamos verificações reais
        return reply.code(200).send({
          success: true,
          data: {
            status: "healthy",
            timestamp: new Date().toISOString(),
            queueSize: 0, // Seria calculado
            pendingItems: 0,
            inProgressItems: 0,
          },
          message: "Fila de produção está saudável",
        });
      } catch (error) {
        request.log.error("Erro ao verificar saúde da fila:", error);
        
        return reply.code(500).send({
          success: false,
          error: "Erro interno ao verificar saúde da fila",
        });
      }
    }
  );
}