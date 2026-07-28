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

// PgBoss (job queue centralizada — ADR-009)
import { startJobQueue, startWorker } from "@/shared/infra/job-queue";

// (legacy jobs removidos — módulos migrados para integration)
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
    // erro de validação Fastify (schema da rota)
    if (error.validation) {
      return reply.status(400).send({
        success: false,
        error: "VALIDATION_ERROR",
        message: "Invalid request payload"
      });
    }

    // erro de validação Zod (parse manual)
    if (error instanceof ZodError) {
      return reply.status(422).send({
        success: false,
        error: "VALIDATION_ERROR",
        message: JSON.stringify(error.errors)
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
  // ✅ PgBoss — Job Queue Centralizada
  // ---------------------------------------------------------------------------
  const boss = await startJobQueue();
  await startWorker(boss);

  return app;
}