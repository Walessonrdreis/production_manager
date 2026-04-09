import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { env } from './env';

const app = Fastify({
  logger: true,
});

// Error Handler Padronizado
app.setErrorHandler((error, request, reply) => {
  app.log.error(error);
  
  reply.status(error.statusCode || 500).send({
    code: error.code || 'INTERNAL_SERVER_ERROR',
    message: error.message || 'An unexpected error occurred.',
  });
});

// Simulação de rotas (poderia estar em um arquivo separado)
async function registerRoutes(fastify: FastifyInstance) {
  fastify.get('/health', async () => {
    return { status: 'ok' };
  });
}

async function bootstrap() {
  try {
    // CORS
    await app.register(cors, {
      origin: env.CORS_ORIGIN,
    });

    // Rotas
    await app.register(registerRoutes);

    // Iniciar servidor
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    app.log.info(`Server running on http://localhost:${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

bootstrap();
