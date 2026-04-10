import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import crypto from 'crypto';
import { env } from './env';
import { appRoutes } from './routes';
import { AppError } from './core/errors/AppError';

// Extende a tipagem do Request do Fastify para aceitar a nova propriedade "requestId"
declare module 'fastify' {
  interface FastifyRequest {
    requestId: string;
  }
}

const app = Fastify({
  logger: true,
});

// Hook: Ler ou gerar requestId por request
app.decorateRequest('requestId', '');
app.addHook('onRequest', async (request, reply) => {
  const incomingId = request.headers['x-request-id'] as string;
  request.requestId = incomingId || crypto.randomUUID();
  
  // Opcional: Anexar o requestId aos logs padrão do Fastify caso queira rastreabilidade profunda
  request.log = request.log.child({ reqId: request.requestId });
});

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

// Error Handler Padronizado
app.setErrorHandler((error, request, reply) => {
  if (isAppError(error)) {
    app.log.warn(`[${error.code}] ${error.message} (requestId: ${request.requestId})`);
    
    const isDev = process.env.NODE_ENV !== 'production';
    
    return reply.status(error.statusCode).send({
      code: error.code,
      message: error.message,
      details: isDev ? {
        ...(error.details || {}),
        message: error.message,
        stack: error.stack
      } : error.details,
      requestId: request.requestId
    });
  }

  // Loga apenas os erros inesperados com detalhes completos
  app.log.error({ err: error, requestId: request.requestId }, 'Erro Inesperado');

  // Fallback 500 para erros não mapeados
  reply.status(500).send({
    code: 'INTERNAL_ERROR',
    message: 'Erro interno',
    requestId: request.requestId
  });
});

async function bootstrap() {
  try {
    // CORS
    await app.register(cors, {
      origin: env.CORS_ORIGIN,
    });

    // Rotas
    await app.register(appRoutes);

    // Iniciar servidor
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    app.log.info(`Server running on http://localhost:${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

bootstrap();
