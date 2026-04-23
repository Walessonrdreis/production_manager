import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import crypto from 'crypto';
import { ZodError } from 'zod';
import { env } from '@/config/env.js';
import { appRoutes } from '../../routes';
import { AppError } from '../../core/errors/AppError';
import { startStockRefreshJob } from '../../jobs/stockRefresh.job';
import { startOmieProductSyncJob } from '../../jobs/omieProductSync.job';
import { startOmieOrdersStage20SyncJob } from '../../jobs/omieOrdersStage20.job';


// Extende a tipagem do Request do Fastify para aceitar a nova propriedade "requestId"
declare module 'fastify' {
  interface FastifyRequest {
    requestId: string;
  }
}

// Duck-typing para verificar se é um AppError válido (mesmo se falhar no instanceof por conta de transpilação/imports duplos)
function isAppError(err: any): err is AppError {
  return (
    err !== null &&
    typeof err === 'object' &&
    typeof err.code === 'string' &&
    typeof err.statusCode === 'number' &&
    typeof err.message === 'string'
  );
}

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: process.env.NODE_ENV !== 'test',
    trustProxy: true,
  });

  const allowedOrigins = new Set(
    env.CORS_ORIGIN
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean)
  );

  if (process.env.NODE_ENV !== 'production') {
    allowedOrigins.add('http://localhost:5173');
    allowedOrigins.add('http://localhost:5174');
    allowedOrigins.add('http://127.0.0.1:5173');
    allowedOrigins.add('http://127.0.0.1:5174');
  }

  await app.register(cors, {
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} not allowed by CORS`), false);
    },
  });

  // Hook: Ler ou gerar requestId por request
  app.decorateRequest('requestId', '');
  app.addHook('onRequest', async (request, reply) => {
    const incomingId = request.headers['x-request-id'] as string;
    request.requestId = incomingId || crypto.randomUUID();
    
    // Opcional: Anexar o requestId aos logs padrão do Fastify caso queira rastreabilidade profunda
    if (process.env.NODE_ENV !== 'test') {
      request.log = request.log.child({ reqId: request.requestId });
    }
  });

  // Error Handler Padronizado
  app.setErrorHandler((error, request, reply) => {
    const requestId = request.requestId;
    const isDev = process.env.NODE_ENV !== 'production';

    if (error instanceof ZodError) {
      const message = error.issues?.[0]?.message || 'Dados inválidos.';

      const details = isDev
        ? { ...error.format(), stack: error.stack }
        : error.format();

      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message,
          details,
          requestId,
        },
      });
    }

    if (isAppError(error)) {
      if (process.env.NODE_ENV !== 'test') {
        request.log.warn({ requestId }, `[${error.code}] ${error.message}`);
      }

      const details = isDev
        ? { ...(error.details || {}), stack: error.stack }
        : error.details;

      return reply.status(error.statusCode).send({
        error: {
          code: error.code,
          message: error.message,
          ...(details ? { details } : {}),
          requestId,
        },
      });
    }

    // Loga apenas os erros inesperados com detalhes completos
    if (process.env.NODE_ENV !== 'test') {
      request.log.error({ err: error, requestId }, 'Erro Inesperado');
    }

    // Fallback 500 para erros não mapeados
    reply.status(500).send({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Erro interno',
        requestId,
      },
    });
  });

  await app.register(appRoutes);

  startStockRefreshJob(app);
  startOmieProductSyncJob(app);
  startOmieOrdersStage20SyncJob(app);

  return app;
}
