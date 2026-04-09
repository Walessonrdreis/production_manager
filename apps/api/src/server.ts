import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { env } from './env';
import { appRoutes } from './routes';
import { AppError } from './utils/domainErrors';
import { ErrorCodes } from './utils/errors';

const app = Fastify({
  logger: true,
});

// Error Handler Padronizado
app.setErrorHandler((error, request, reply) => {
  app.log.error(error);

  // Captura erros de domínio customizados
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      code: error.code,
      message: error.message,
      ...(error.details && { details: error.details }),
    });
  }

  // Fallback 500 para erros não mapeados
  reply.status(500).send({
    code: ErrorCodes.INTERNAL_SERVER_ERROR,
    message: 'An unexpected error occurred.',
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
