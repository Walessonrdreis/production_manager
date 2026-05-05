// File: apps/api/src/modules/client/presentation/http/client.routes.ts

import { FastifyInstance } from 'fastify';
import { ClientController } from '../client.controller';
import { getClientByOmieClientCodeSchema } from './client.schemas';

export async function clientRoutes(app: FastifyInstance) {
  const controller = new ClientController();

  app.get(
    '/clients/:omieClientCode',
    { schema: getClientByOmieClientCodeSchema },
    controller.getByOmieClientCode.bind(controller)
  );
}