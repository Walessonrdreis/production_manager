import Fastify, { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import crypto from "crypto";
import { ZodError } from "zod";

import { env } from "@/config";
import { AppError } from "@/shared/errors/AppError";
import { registerRoutes } from "@/bootstrap/routes";

import { setBaseLogger } from "@/shared/logger";
import { prisma } from "@/infra/db";

// ✅ IMPORTAR O CLIENT DA OMIE COM CIRCUIT BREAKER
import { createOmieClientWithCircuitBreaker } from "@/shared/integrations/omie/omie-client-with-circuit-breaker";
import { createOmieStockCache } from "@/shared/integrations/omie/omie-stock-cache";

// jobs (nova arquitetura)
import { startStockRefreshJob } from "@/modules/legacy/products/infrastructure/jobs/stock-refresh.job";
import { startOmieProductSyncJob } from "@/modules/legacy/products/infrastructure/jobs/omie-product-sync.job";
import { startOmieOrdersStage20SyncJob } from "@/modules/legacy/omie-sales-orders/infrastructure/jobs/omie-orders-stage20.job";
import { startOmieProductionOrdersSyncJob } from "@/modules/legacy/omie-production-orders/infrastructure/jobs/omie-production-orders-sync.job";
import { startOmieClientSyncJob } from "@/modules/legacy/client/infrastructure/jobs/sync-omie-clients.job"; 

import { registerProductStructureJobs } from "@/modules/integration/product-structure/infrastructure/jobs/product-structure-jobs.register";

import { ListOrdersViewUseCase } from "@/modules/legacy/orders-view/application/list-orders-view.usecase";
import type { ListClientsUseCase } from "@/modules/legacy/client/application/use-cases/list-clients.usecase";
import type { ListStage20OrdersEnrichedUseCase } from "@/modules/legacy/orders-enriched/application/use-cases/list-stage20-orders-enriched.usecase";
import { startOmieProductStructureSyncJob } from "@/modules/legacy/product-structure/infrastructure/jobs/omie-product-structure-sync.job";
// Documentação OpenAPI simplificada
import { registerOpenAPIDocumentation } from "./openapi-simple";

// Extende tipagem do request para requestId
declare module "fastify" {
  interface FastifyRequest {
    requestId: string;
  }

  // ✅ tipa as decorações do app
  interface FastifyInstance {
    prisma: typeof prisma;
    omieClient: {
      post: <T>(path: string, payload: any) => Promise<T>;
      getCircuitBreakerMetrics: () => any;
      resetCircuitBreaker: () => void;
    };
    clientSyncState: {
      running: boolean;
      lastStartedAt: Date | null;
      lastFinishedAt: Date | null;
    };
    listClientsUseCase: ListClientsUseCase;
    listStage20OrdersEnrichedUseCase: ListStage20OrdersEnrichedUseCase;
    ordersViewUseCase: ListOrdersViewUseCase;
    omieStockCache: ReturnType<typeof createOmieStockCache>;
  }
}

// Duck-typing para AppError
function isAppError(err: any): err is AppError {
  return (
    err !== null &&
    typeof err === "object" &&
    typeof err.code === "string" &&
    typeof err.statusCode === "number" &&
    typeof err.message === "string"
  );
}

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: process.env.NODE_ENV !== "test",
    trustProxy: true,
    // Configurações de timeout para prevenir requisições muito longas
    connectionTimeout: 30000, // 30 segundos para estabelecer conexão
    requestTimeout: 45000, // 45 segundos para completar requisição
    bodyLimit: 1048576, // 1MB limite de corpo
  });

  // logger e prisma
  setBaseLogger(app.log);
  app.decorate("prisma", prisma);

  // ---------------------------------------------------------------------------
  // ✅ OMIE CLIENT (OBRIGATÓRIO) - precisa existir antes das rotas/módulos
  // ---------------------------------------------------------------------------
 app.decorate("omieClient", createOmieClientWithCircuitBreaker({
  baseUrl: env.OMIE_BASE_URL,
  appKey: env.OMIE_APP_KEY,
  appSecret: env.OMIE_APP_SECRET,
  timeoutMs: 10000, // Reduzido para 10 segundos
  retry: { attempts: 2, baseDelayMs: 1000, maxDelayMs: 3000 }, // Menos tentativas
  debug: process.env.NODE_ENV !== "production",
  circuitBreaker: {
    failureThreshold: 3, // Abre circuito após 3 falhas consecutivas
    resetTimeoutMs: 30000, // 30 segundos em estado aberto
    successThreshold: 2, // 2 sucessos para fechar circuito
  },
}));

  const omieStockCache = createOmieStockCache(app.omieClient, { logger: app.log });
  app.decorate("omieStockCache", omieStockCache);

  // ---------------------------------------------------------------------------
  // CORS
  // ---------------------------------------------------------------------------
  const allowedOrigins = new Set(
    env.CORS_ORIGIN.split(",")
      .map((origin: string) => origin.trim())
      .filter(Boolean)
  );

  if (process.env.NODE_ENV !== "production") {
    allowedOrigins.add("http://localhost:5173");
    allowedOrigins.add("http://localhost:5174");
    allowedOrigins.add("http://127.0.0.1:5173");
    allowedOrigins.add("http://127.0.0.1:5174");
  }

  await app.register(cors, {
    origin: (origin: string | undefined, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.has(origin)) return callback(null, true);
      return callback(new Error(`Origin ${origin} not allowed by CORS`), false);
    },
  });

  // ---------------------------------------------------------------------------
  // requestId
  // ---------------------------------------------------------------------------
  app.decorateRequest("requestId", "");
  app.addHook("onRequest", async (request) => {
    const incomingId = request.headers["x-request-id"] as string;
    request.requestId = incomingId || crypto.randomUUID();

    if (process.env.NODE_ENV !== "test") {
      request.log = request.log.child({ reqId: request.requestId });
    }
  });

  // ---------------------------------------------------------------------------
  // Error handler
  // ---------------------------------------------------------------------------
  app.setErrorHandler((error, request, reply) => {
    // erro de validação 
    if (error.validation) {
      return reply.status(400).send({
        success: false,
        error: "VALIDATION_ERROR",
        message: "Invalid request payload"
      });
    }

    // erro geral
    return reply.status(error.statusCode || 500).send({
      success: false,
      error: "INTERNAL_ERROR",
      message: error.message || "Unexpected error"
    });
  });

  // ---------------------------------------------------------------------------
  // Documentação OpenAPI
  // ---------------------------------------------------------------------------
  registerOpenAPIDocumentation(app);

  // ---------------------------------------------------------------------------
  // Rotas
  // ---------------------------------------------------------------------------
  await registerRoutes(app);

  /// ---------------------------------------------------------------------------
// Jobs (✅ UMA VEZ, ✅ DEPOIS DAS ROTAS)
// ---------------------------------------------------------------------------
if (env.ENABLE_STOCK_REFRESH_JOB) {
  startStockRefreshJob(app);
}

if (env.ENABLE_OMIE_PRODUCT_SYNC_JOB) {
  startOmieProductSyncJob(app);
}

if (env.ENABLE_OMIE_PRODUCT_STRUCTURE_SYNC_JOB) {
  registerProductStructureJobs(app.omieClient);
  // startOmieProductStructureSyncJob(app); // desativar legacy
}

if (env.OMIE_ORDERS_STAGE_SYNC) {
  startOmieOrdersStage20SyncJob(app);
}

if (env.OMIE_PRODUCTION_ORDERS_SYNC) {
  startOmieProductionOrdersSyncJob(app);
}

if (env.ENABLE_OMIE_CLIENT_SYNC_JOB) {
  startOmieClientSyncJob(app);
}
// ✅ opcional: sync on startup (sem depender de use cases no bootstrap)
if (process.env.OMIE_ORDERS_STAGE_SYNC_ON_STARTUP === "true") {
  setImmediate(async () => {
    try {
      const res = await app.inject({
        method: "POST",
        url: "/v1/admin/omie/orders/stage20/sync",
      });

      app.log.info(
        { statusCode: res.statusCode, body: res.body },
        "[Startup] Stage20 orders sync triggered"
      );
    } catch (err) {
      app.log.error({ err }, "[Startup] Stage20 orders sync failed");
    }
  });
}

  return app;
}