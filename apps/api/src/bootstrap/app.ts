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
import { startOmieOrdersStage20SyncJob } from "@/modules/omie-orders/infrastructure/jobs/omie-orders-stage20.job";

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
  app.decorate(
  "omieClient",
  createOmieClient({
    appKey: env.OMIE_APP_KEY,
    appSecret: env.OMIE_APP_SECRET,
    baseUrl: env.OMIE_BASE_URL,
  })
);

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
  // Rotas
  // ---------------------------------------------------------------------------
  await registerRoutes(app);

  // (opcional) manter enquanto você está validando endpoints
  console.log(app.printRoutes());

  // ---------------------------------------------------------------------------
  // Jobs (✅ UMA VEZ, ✅ DEPOIS DAS ROTAS)
  // ---------------------------------------------------------------------------
  if (env.ENABLE_STOCK_REFRESH_JOB) {
    startStockRefreshJob(app);
  }

  if (env.ENABLE_OMIE_PRODUCT_SYNC_JOB) {
    startOmieProductSyncJob(app);
  }

  if (env.OMIE_ORDERS_STAGE_SYNC) {
    startOmieOrdersStage20SyncJob(app);
  }

  return app;
}
``