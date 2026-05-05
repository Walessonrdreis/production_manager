// File: apps/api/src/modules/client/presentation/http/client-admin.controller.ts

import { FastifyReply, FastifyRequest } from "fastify";

export class ClientAdminController {
  async syncFromOmie(request: FastifyRequest, reply: FastifyReply) {
    request.log.info("[ClientAdmin] Manual sync requested");

    await request.server.syncOmieClientsUseCase.execute();

    return reply.code(204).send();
  }
}