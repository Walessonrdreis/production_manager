// File: apps/api/src/modules/legacy/client/register.ts

import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

import { ClientPrismaRepository } from './infrastructure/db/client.repo.prisma';
import { clientAdminRoutes } from "./presentation/http/client-admin.routes";
import { OmieClientGatewayImpl } from './infrastructure/integrations/omie/omie-client.gateway';
import { SyncOmieClientsUseCase } from './application/use-cases/sync-omie-clients.usecase';
import { GetClientByOmieClientCodeUseCase } from './application/use-cases/get-client-by-omie-client-code.usecase';

import { clientRoutes } from './presentation/http/client.routes';
import { ListClientsUseCase } from "./application/use-cases/list-clients.usecase";
import { clientListRoutes } from "./presentation/http/client-list.routes";
// shared Omie client
import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";
import { syncMissingClientsController } from "./presentation/http/sync-missing-clients.controller";

export async function registerClientModule(app: FastifyInstance) {
  const prisma = app.prisma as PrismaClient;
 const omieClient = app.omieClient as OmieHttpClientPort;

  // repository
  const clientRepository = new ClientPrismaRepository(prisma);
  const listClientsUseCase = new ListClientsUseCase(clientRepository);
  
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
  app.decorate("listClientsUseCase", listClientsUseCase);
  app.decorate('omieClientGateway', omieClientGateway);
  app.decorate('syncOmieClientsUseCase', syncOmieClientsUseCase);
  app.decorate(
    'getClientByOmieClientCodeUseCase',
    getClientByOmieClientCodeUseCase
  );

  
  // ✅ sync state (lock + cooldown)
  app.decorate('clientSyncState', {
    running: false,
    lastStartedAt: null as Date | null,
    lastFinishedAt: null as Date | null,
  });

app.post(
  "/v1/admin/omie/clients/sync-missing",
  syncMissingClientsController
);
  // ✅ REGISTRO DAS ROTAS (NO PADRÃO DO PROJETO)
  await app.register(clientRoutes, { prefix: '/v1' });
await app.register(clientAdminRoutes, { prefix: "/v1" });
await app.register(clientListRoutes, { prefix: "/v1" });
}