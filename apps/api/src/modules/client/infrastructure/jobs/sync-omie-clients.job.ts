// File: apps/api/src/modules/client/infrastructure/jobs/sync-omie-clients.job.ts

import { FastifyInstance } from 'fastify';

export async function syncOmieClientsJob(app: FastifyInstance) {
  app.log.info('[Client] Starting Omie clients sync');

  await app.syncOmieClientsUseCase.execute();

  app.log.info('[Client] Finished Omie clients sync');
}
