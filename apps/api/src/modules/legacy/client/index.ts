// File: apps/api/src/modules/client/index.ts

import { FastifyInstance } from 'fastify';
import { registerClientModule } from './register';
import { clientRoutes } from './presentation/http/client.routes';

export async function clientModule(app: FastifyInstance) {
  await registerClientModule(app);
  await app.register(clientRoutes);
}