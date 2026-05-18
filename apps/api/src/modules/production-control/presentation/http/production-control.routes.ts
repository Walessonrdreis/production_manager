import type { FastifyInstance } from "fastify";
import { createProductionControlController } from "./production-control.controller";
import { productionControlSchemas } from "./production-control.schemas";

export function registerProductionControlRoutes(app: FastifyInstance) {
  const controller = createProductionControlController(app);

  // ✅ Adiciona schemas de validação
  app.addSchema(productionControlSchemas);

  // ✅ Rotas de Snapshots
  app.route({
    method: "GET",
    url: "/api/production-control/snapshots",
    schema: {
      tags: ["production-control"],
      summary: "Lista todos os snapshots de controle de produção",
      querystring: {
        type: "object",
        properties: {
          limit: { type: "string", default: "50" },
          offset: { type: "string", default: "0" },
          orderBy: { type: "string", enum: ["createdAt", "snapshotId"], default: "createdAt" },
          orderDirection: { type: "string", enum: ["asc", "desc"], default: "desc" },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            data: {
              type: "array",
              items: { $ref: "SnapshotSchema#" },
            },
            meta: {
              type: "object",
              properties: {
                limit: { type: "number" },
                offset: { type: "number" },
                total: { type: "number" },
              },
            },
          },
        },
      },
    },
    handler: controller.listSnapshots,
  });

  app.route({
    method: "GET",
    url: "/api/production-control/snapshots/:id",
    schema: {
      tags: ["production-control"],
      summary: "Obtém um snapshot específico pelo ID",
      params: {
        type: "object",
        properties: {
          id: { type: "string" },
        },
        required: ["id"],
      },
      response: {
        200: {
          type: "object",
          properties: {
            data: { $ref: "SnapshotSchema#" },
          },
        },
      },
    },
    handler: controller.getSnapshotById,
  });

  app.route({
    method: "GET",
    url: "/api/production-control/snapshots/:id/products",
    schema: {
      tags: ["production-control"],
      summary: "Lista produtos de um snapshot específico",
      params: {
        type: "object",
        properties: {
          id: { type: "string" },
        },
        required: ["id"],
      },
      querystring: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["PENDING", "IN_PROGRESS", "COMPLETED"] },
          limit: { type: "string", default: "100" },
          offset: { type: "string", default: "0" },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            data: {
              type: "array",
              items: { $ref: "ProductSchema#" },
            },
            meta: {
              type: "object",
              properties: {
                limit: { type: "number" },
                offset: { type: "number" },
                total: { type: "number" },
              },
            },
          },
        },
      },
    },
    handler: controller.getSnapshotProducts,
  });

  // ✅ Rotas de Produtos
  app.route({
    method: "GET",
    url: "/api/production-control/products/:productId",
    schema: {
      tags: ["production-control"],
      summary: "Obtém detalhes de um produto específico",
      params: {
        type: "object",
        properties: {
          productId: { type: "string" },
        },
        required: ["productId"],
      },
      response: {
        200: {
          type: "object",
          properties: {
            data: { $ref: "ProductWithOrdersSchema#" },
          },
        },
      },
    },
    handler: controller.getProductDetails,
  });

  app.route({
    method: "POST",
    url: "/api/production-control/products/:productId/toggle-check",
    schema: {
      tags: ["production-control"],
      summary: "Marca/desmarca todos os pedidos de um produto",
      params: {
        type: "object",
        properties: {
          productId: { type: "string" },
        },
        required: ["productId"],
      },
      response: {
        200: {
          type: "object",
          properties: {
            data: { $ref: "ProductSchema#" },
          },
        },
      },
    },
    handler: controller.toggleProductCheck,
  });

  app.route({
    method: "PUT",
    url: "/api/production-control/products/:productId/dates",
    schema: {
      tags: ["production-control"],
      summary: "Atualiza datas programada e realizada de um produto",
      params: {
        type: "object",
        properties: {
          productId: { type: "string" },
        },
        required: ["productId"],
      },
      body: {
        type: "object",
        properties: {
          scheduledDate: { type: "string", format: "date-time" },
          actualDate: { type: "string", format: "date-time" },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            data: { $ref: "ProductSchema#" },
          },
        },
      },
    },
    handler: controller.updateProductDates,
  });

  // ✅ Rotas de Pedidos
  app.route({
    method: "POST",
    url: "/api/production-control/orders/:orderId/toggle-check",
    schema: {
      tags: ["production-control"],
      summary: "Marca/desmarca um pedido específico",
      params: {
        type: "object",
        properties: {
          orderId: { type: "string" },
        },
        required: ["orderId"],
      },
      response: {
        200: {
          type: "object",
          properties: {
            data: { $ref: "OrderSchema#" },
          },
        },
      },
    },
    handler: controller.toggleOrderCheck,
  });

  // ✅ Rotas de Histórico
  app.route({
    method: "GET",
    url: "/api/production-control/products/:productId/history",
    schema: {
      tags: ["production-control"],
      summary: "Obtém histórico de ações de um produto",
      params: {
        type: "object",
        properties: {
          productId: { type: "string" },
        },
        required: ["productId"],
      },
      querystring: {
        type: "object",
        properties: {
          action: { type: "string" },
          limit: { type: "string", default: "100" },
          offset: { type: "string", default: "0" },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            data: {
              type: "array",
              items: { $ref: "HistorySchema#" },
            },
            meta: {
              type: "object",
              properties: {
                limit: { type: "number" },
                offset: { type: "number" },
                total: { type: "number" },
              },
            },
          },
        },
      },
    },
    handler: controller.getProductHistory,
  });

  app.route({
    method: "GET",
    url: "/api/production-control/orders/:orderId/history",
    schema: {
      tags: ["production-control"],
      summary: "Obtém histórico de ações de um pedido",
      params: {
        type: "object",
        properties: {
          orderId: { type: "string" },
        },
        required: ["orderId"],
      },
      querystring: {
        type: "object",
        properties: {
          action: { type: "string" },
          limit: { type: "string", default: "100" },
          offset: { type: "string", default: "0" },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            data: {
              type: "array",
              items: { $ref: "HistorySchema#" },
            },
            meta: {
              type: "object",
              properties: {
                limit: { type: "number" },
                offset: { type: "number" },
                total: { type: "number" },
              },
            },
          },
        },
      },
    },
    handler: controller.getOrderHistory,
  });

  // ✅ Rotas de Administração
  app.route({
    method: "POST",
    url: "/api/production-control/snapshots",
    schema: {
      tags: ["production-control"],
      summary: "Cria um novo snapshot manualmente",
      body: {
        type: "object",
        properties: {
          description: { type: "string" },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            data: {
              type: "object",
              properties: {
                snapshotId: { type: "string" },
                newProducts: { type: "number" },
                updatedProducts: { type: "number" },
                completedProducts: { type: "number" },
              },
            },
          },
        },
      },
    },
    handler: controller.createSnapshot,
  });

  app.route({
    method: "POST",
    url: "/api/production-control/cleanup",
    schema: {
      tags: ["production-control"],
      summary: "Limpa dados antigos do sistema",
      body: {
        type: "object",
        properties: {
          olderThanDays: { type: "number", default: 30 },
          keepLast: { type: "number", default: 100 },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            data: {
              type: "object",
              properties: {
                snapshotsDeleted: { type: "number" },
                historiesDeleted: { type: "number" },
              },
            },
          },
        },
      },
    },
    handler: controller.cleanupOldData,
  });

  // ✅ Health check do módulo
  app.route({
    method: "GET",
    url: "/api/production-control/health",
    schema: {
      tags: ["production-control"],
      summary: "Verifica saúde do módulo de controle de produção",
      response: {
        200: {
          type: "object",
          properties: {
            status: { type: "string" },
            timestamp: { type: "string", format: "date-time" },
            version: { type: "string" },
          },
        },
      },
    },
    handler: async (_request, reply) => {
      return reply.send({
        status: "healthy",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
      });
    },
  });
}