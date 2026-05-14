import Fastify, { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import crypto from "crypto";
import { ZodError } from "zod";

import { env } from "@/config";
import { AppError } from "@/shared/errors/AppError";
import { registerRoutes } from "@/bootstrap/routes";

import { setBaseLogger } from "@/shared/logger";
import { prisma } from "@/infra/db";

// ✅ IMPORTAR O CLIENT DA OMIE (ajuste o caminho/nome se necessário)
import { createOmieClient } from "@/shared/integrations/omie/omie.client";

// jobs (nova arquitetura)
import { startStockRefreshJob } from "@/modules/products/infrastructure/jobs/stock-refresh.job";
import { startOmieProductSyncJob } from "@/modules/products/infrastructure/jobs/omie-product-sync.job";
import { startOmieOrdersStage20SyncJob } from "@/modules/omie-sales-orders/infrastructure/jobs/omie-orders-stage20.job";
import { startOmieProductionOrdersSyncJob } from "@/modules/omie-production-orders/infrastructure/jobs/omie-production-orders-sync.job";
import { startOmieClientSyncJob } from "@/modules/client/infrastructure/jobs/sync-omie-clients.job"; 

import { ListOrdersViewUseCase } from "@/modules/orders-view/application/list-orders-view.usecase";
import type { ListClientsUseCase } from "@/modules/client/application/use-cases/list-clients.usecase";
import type { ListStage20OrdersEnrichedUseCase } from "@/modules/orders-enriched/application/use-cases/list-stage20-orders-enriched.usecase";
import { startOmieProductStructureSyncJob } from "@/modules/product-structure/infrastructure/jobs/omie-product-structure-sync.job";
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
    };
    clientSyncState: {
      running: boolean;
      lastStartedAt: Date | null;
      lastFinishedAt: Date | null;
    };
    listClientsUseCase: ListClientsUseCase;
    listStage20OrdersEnrichedUseCase: ListStage20OrdersEnrichedUseCase;
    ordersViewUseCase: ListOrdersViewUseCase;
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
  });

  // logger e prisma
  setBaseLogger(app.log);
  app.decorate("prisma", prisma);

  // ---------------------------------------------------------------------------
  // ✅ OMIE CLIENT (OBRIGATÓRIO) - precisa existir antes das rotas/módulos
  // ---------------------------------------------------------------------------
 app.decorate("omieClient", createOmieClient({
  baseUrl: env.OMIE_BASE_URL,
  appKey: env.OMIE_APP_KEY,
  appSecret: env.OMIE_APP_SECRET,
  timeoutMs: 20000,
  retry: { attempts: 5, baseDelayMs: 500, maxDelayMs: 2000 },
  debug: process.env.NODE_ENV !== "production",
}));

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
    const requestId = request.requestId;
    const isDev = process.env.NODE_ENV !== "production";

    if (error instanceof ZodError) {
      const message = error.issues?.[0]?.message || "Dados inválidos.";

      const details = isDev ? { ...error.format(), stack: error.stack } : error.format();

      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message,
          details,
          requestId,
        },
      });
    }

    if (isAppError(error)) {
      if (process.env.NODE_ENV !== "test") {
        request.log.warn({ requestId }, `[${error.code}] ${error.message}`);
      }

      const details = isDev ? { ...(error.details || {}), stack: error.stack } : error.details;

      return reply.status(error.statusCode).send({
        error: {
          code: error.code,
          message: error.message,
          ...(details ? { details } : {}),
          requestId,
        },
      });
    }

    if (process.env.NODE_ENV !== "test") {
      request.log.error({ err: error, requestId }, "Erro Inesperado");
    }

    return reply.status(500).send({
      error: {
        code: "INTERNAL_ERROR",
        message: "Erro interno",
        requestId,
      },
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

  // (opcional) manter enquanto você está validando endpoints
  
  console.log(app.printRoutes());


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
  startOmieProductStructureSyncJob(app);
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