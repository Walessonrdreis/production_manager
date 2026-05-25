import type { FastifyReply, FastifyRequest } from "fastify";
import { createSyncMissingClientsUseCase } from "../../application/use-cases/sync-missing-clients.usecase";

export async function syncMissingClientsController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const serverAny = request.server as any;

    const clientRepository = serverAny.clientRepository;
    const omieClientGateway = serverAny.omieClientGateway;

    const useCase = createSyncMissingClientsUseCase({
      clientRepository,
      omieClientGateway,
    });

    const result = await useCase.execute();

    return reply.code(200).send({ success: true, data: result });
  } catch (err: any) {
    return reply.code(500).send({
      success: false,
      error: "INTERNAL_ERROR",
      message: err?.message || "Failed to sync missing clients",
    });
  }
}