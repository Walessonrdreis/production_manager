import { FastifyInstance } from "fastify";

import type { SyncStockUseCase } from "../../application/use-cases/sync-stock.usecase";
import type { SyncOrdersUseCase } from "../../application/use-cases/sync-orders.usecase";
import type { GetSyncStatusUseCase } from "../../application/use-cases/get-sync-status.usecase";
import type { SyncRepositoryPort } from "../../application/ports/sync.repository.port";

export interface SyncDependencies {
  syncStockUseCase: SyncStockUseCase;
  syncOrdersUseCase: SyncOrdersUseCase;
  getSyncStatusUseCase: GetSyncStatusUseCase;
  syncRepository: SyncRepositoryPort;
}

// Schemas JSON Schema válidos para Fastify
const SyncStockRequestSchema = {
  type: "object",
  properties: {
    forceRefresh: { type: "boolean" },
    productCodes: { 
      type: "array",
      items: { type: "string" }
    },
    batchSize: { type: "number" }
  },
  additionalProperties: false
};

const SyncStockResponseSchema = {
  type: "object",
  properties: {
    success: { type: "boolean" },
    message: { type: "string" },
    data: {
      type: "object",
      properties: {
        totalProducts: { type: "number" },
        syncedProducts: { type: "number" },
        failedProducts: { type: "number" },
        durationMs: { type: "number" }
      }
    },
    timestamp: { type: "string" }
  },
  required: ["success", "message", "timestamp"],
  additionalProperties: false
};

const SyncOrdersRequestSchema = {
  type: "object",
  properties: {
    startDate: { type: "string" },
    endDate: { type: "string" }
  },
  additionalProperties: false
};

const SyncOrdersResponseSchema = {
  type: "object",
  properties: {
    success: { type: "boolean" },
    message: { type: "string" },
    data: {
      type: "object",
      properties: {
        totalOrders: { type: "number" },
        syncedOrders: { type: "number" },
        failedOrders: { type: "number" },
        durationMs: { type: "number" }
      }
    },
    timestamp: { type: "string" }
  },
  required: ["success", "message", "timestamp"],
  additionalProperties: false
};

const SyncStatusRequestSchema = {
  type: "object",
  properties: {
    syncType: { type: "string" }
  },
  additionalProperties: false
};

const SyncStatusResponseSchema = {
  type: "object",
  properties: {
    status: { type: "string" },
    lastSync: { type: "string" },
    statistics: {
      type: "object",
      properties: {
        stock: {
          type: "object",
          properties: {
            lastSync: { type: "string" },
            totalProducts: { type: "number" },
            successRate: { type: "number" }
          }
        },
        orders: {
          type: "object",
          properties: {
            lastSync: { type: "string" },
            totalOrders: { type: "number" },
            successRate: { type: "number" }
          }
        }
      }
    }
  },
  required: ["status"],
  additionalProperties: false
};

export function registerSyncRoutes(app: FastifyInstance, dependencies?: SyncDependencies): void {
  // Se dependências não foram fornecidas, usar container DI (se existir)
  const useDiContainer = !dependencies && (app as any).diContainer;
  
  // POST /api/sync/stock - Sincronizar estoque
  app.post(
    "/api/sync/stock",
    {
      schema: {
        description: "Sincroniza dados de estoque do Omie",
        tags: ["sync"],
        body: SyncStockRequestSchema,
        response: {
          200: SyncStockResponseSchema,
          400: {
            type: "object",
            properties: {
              error: { type: "string" },
              message: { type: "string" },
            },
            additionalProperties: false
          },
          500: {
            type: "object",
            properties: {
              error: { type: "string" },
              message: { type: "string" },
            },
            additionalProperties: false
          },
        },
      },
    },
    async (request, reply) => {
      try {
        let syncStockUseCase;
        
        if (dependencies) {
          syncStockUseCase = dependencies.syncStockUseCase;
        } else if (useDiContainer) {
          syncStockUseCase = (app as any).diContainer.resolve("syncStockUseCase");
        } else {
          throw new Error("Sync dependencies not available");
        }
        
        const result = await syncStockUseCase.execute(request.body as any);
        
        if (!result.success) {
          return reply.status(500).send({
            error: "SyncFailed",
            message: result.message,
          });
        }
        
        return reply.status(200).send(result);
      } catch (error) {
        app.log.error("Stock sync failed", { error });
        return reply.status(500).send({
          error: "InternalServerError",
          message: error instanceof Error ? error.message : "Unknown error occurred",
        });
      }
    }
  );

  // POST /api/sync/orders - Sincronizar pedidos
  app.post(
    "/api/sync/orders",
    {
      schema: {
        description: "Sincroniza dados de pedidos do Omie",
        tags: ["sync"],
        body: SyncOrdersRequestSchema,
        response: {
          200: SyncOrdersResponseSchema,
          400: {
            type: "object",
            properties: {
              error: { type: "string" },
              message: { type: "string" },
            },
            additionalProperties: false
          },
          500: {
            type: "object",
            properties: {
              error: { type: "string" },
              message: { type: "string" },
            },
            additionalProperties: false
          },
        },
      },
    },
    async (request, reply) => {
      try {
        let syncOrdersUseCase;
        
        if (dependencies) {
          syncOrdersUseCase = dependencies.syncOrdersUseCase;
        } else if (useDiContainer) {
          syncOrdersUseCase = (app as any).diContainer.resolve("syncOrdersUseCase");
        } else {
          throw new Error("Sync dependencies not available");
        }
        
        const result = await syncOrdersUseCase.execute(request.body as any);
        
        if (!result.success) {
          return reply.status(500).send({
            error: "SyncFailed",
            message: result.message,
          });
        }
        
        return reply.status(200).send(result);
      } catch (error) {
        app.log.error("Orders sync failed", { error });
        return reply.status(500).send({
          error: "InternalServerError",
          message: error instanceof Error ? error.message : "Unknown error occurred",
        });
      }
    }
  );

  // GET /api/sync/status - Status das sincronizações
  app.get(
    "/api/sync/status",
    {
      schema: {
        description: "Retorna status e estatísticas das sincronizações",
        tags: ["sync"],
        querystring: SyncStatusRequestSchema,
        response: {
          200: SyncStatusResponseSchema,
          400: {
            type: "object",
            properties: {
              error: { type: "string" },
              message: { type: "string" },
            },
            additionalProperties: false
          },
        },
      },
    },
    async (request, reply) => {
      try {
        let getSyncStatusUseCase;
        
        if (dependencies) {
          getSyncStatusUseCase = dependencies.getSyncStatusUseCase;
        } else if (useDiContainer) {
          getSyncStatusUseCase = (app as any).diContainer.resolve("getSyncStatusUseCase");
        } else {
          throw new Error("Sync dependencies not available");
        }
        
        const result = await getSyncStatusUseCase.execute(request.query as any);
        
        return reply.status(200).send(result);
      } catch (error) {
        app.log.error("Get sync status failed", { error });
        return reply.status(500).send({
          error: "InternalServerError",
          message: error instanceof Error ? error.message : "Unknown error occurred",
        });
      }
    }
  );

  // GET /api/sync/health - Health check do serviço de sincronização
  app.get(
    "/api/sync/health",
    {
      schema: {
        description: "Health check do serviço de sincronização",
        tags: ["sync", "health"],
        response: {
          200: {
            type: "object",
            properties: {
              status: { type: "string" },
              timestamp: { type: "string" },
              services: {
                type: "object",
                properties: {
                  database: { type: "boolean" },
                  omieApi: { type: "boolean" },
                },
              },
            },
            additionalProperties: false
          },
          503: {
            type: "object",
            properties: {
              status: { type: "string" },
              timestamp: { type: "string" },
              services: {
                type: "object",
                properties: {
                  database: { type: "boolean" },
                  omieApi: { type: "boolean" },
                },
              },
              error: { type: "string" }
            },
            additionalProperties: false
          },
        },
      },
    },
    async (request, reply) => {
      try {
        let syncRepository;
        
        if (dependencies) {
          syncRepository = dependencies.syncRepository;
        } else if (useDiContainer) {
          syncRepository = (app as any).diContainer.resolve("syncRepository");
        } else {
          throw new Error("Sync dependencies not available");
        }
        
        // Testar conexão com banco
        await syncRepository.getRecentSyncs({ syncType: "all", limit: 1 });
        
        return reply.status(200).send({
          status: "healthy",
          timestamp: new Date().toISOString(),
          services: {
            database: true,
            omieApi: true, // Assumindo que Omie está acessível
          },
        });
      } catch (error) {
        app.log.error("Health check failed", { error });
        
        return reply.status(503).send({
          status: "unhealthy",
          timestamp: new Date().toISOString(),
          services: {
            database: false,
            omieApi: false,
          },
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );
}