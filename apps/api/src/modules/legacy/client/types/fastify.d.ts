// File: apps/api/src/modules/client/types/fastify.d.ts

import 'fastify';

import type { PrismaClient } from '@prisma/client';

import type { ClientRepository } from '../application/ports/client-repository.port';
import type { OmieClientGateway } from '../application/ports/omie-client-gateway.port';
import type { SyncOmieClientsUseCase } from '../application/use-cases/sync-omie-clients.usecase';

import type { OmieClient } from '../../../../shared/integrations/omie/omie.client';
import type { GetClientByOmieClientCodeUseCase } from '../application/use-cases/get-client-by-omie-client-code.usecase';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
    omieClient: OmieClient;

    clientRepository: ClientRepository;
    omieClientGateway: OmieClientGateway;
    syncOmieClientsUseCase: SyncOmieClientsUseCase;
    getClientByOmieClientCodeUseCase: GetClientByOmieClientCodeUseCase;
  }
}