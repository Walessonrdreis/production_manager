// File: apps/api/src/modules/client/register.ts

import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

import { ClientPrismaRepository } from './infrastructure/db/client.repo.prisma';
import { clientAdminRoutes } from "./presentation/http/client-admin.routes";
import { OmieClientGatewayImpl } from './infrastructure/integrations/omie/omie-client.gateway';
import { SyncOmieClientsUseCase } from './application/use-cases/sync-omie-clients.usecase';
import { GetClientByOmieClientCodeUseCase } from './application/use-cases/get-client-by-omie-client-code.usecase';

import { clientRoutes } from './presentation/http/client.routes';

// shared Omie client
import { OmieClient } from '../../shared/integrations/omie/omie.client';

export async function registerClientModule(app: FastifyInstance) {
  const prisma = app.prisma as PrismaClient;
  const omieClient = app.omieClient as OmieClient;

  // repository
  const clientRepository = new ClientPrismaRepository(prisma);

  // gateway
  const omieClientGateway = new OmieClientGatewayImpl(omieClient);

  // use cases
  const syncOmieClientsUseCase = new SyncOmieClientsUseCase(
    clientRepository,
    omieClientGateway
  );

  const getClientByOmieClientCodeUseCase =
    new GetClientByOmieClientCodeUseCase(clientRepository);

  // dependency injection
  app.decorate('clientRepository', clientRepository);
  app.decorate('omieClientGateway', omieClientGateway);
  app.decorate('syncOmieClientsUseCase', syncOmieClientsUseCase);
  app.decorate(
    'getClientByOmieClientCodeUseCase',
    getClientByOmieClientCodeUseCase
  );

  // ✅ REGISTRO DAS ROTAS (NO PADRÃO DO PROJETO)
  await app.register(clientRoutes, { prefix: '/v1' });
await app.register(clientAdminRoutes, { prefix: "/v1" });
}