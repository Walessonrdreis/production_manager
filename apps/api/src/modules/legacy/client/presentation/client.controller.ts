// File: apps/api/src/modules/client/presentation/http/client.controller.ts

import { FastifyReply, FastifyRequest } from 'fastify';

type GetClientParams = {
  omieClientCode: string;
};

export class ClientController {
  async getByOmieClientCode(
    request: FastifyRequest<{ Params: GetClientParams }>,
    reply: FastifyReply
  ) {
    const { omieClientCode } = request.params;

    if (!/^\d+$/.test(omieClientCode)) {
      return reply.code(400).send({
        message: 'Invalid omieClientCode. Must be a numeric string.',
      });
    }

    const code = BigInt(omieClientCode);

    const client = await request.server.getClientByOmieClientCodeUseCase.execute(
      code
    );

    if (!client) {
      return reply.code(404).send({ message: 'Client not found' });
    }

    return reply.code(200).send({
      omieClientCode: client.omieClientCode.toString(),
      legalName: client.legalName,
      tradeName: client.tradeName ?? null,
      document: client.document,
      personType: client.personType,
      email: client.email ?? null,
      phone: client.phone ?? null,
      isActive: client.isActive,
      isBlocked: client.isBlocked,
      isBillingBlocked: client.isBillingBlocked,
      createdAtOmie: client.createdAtOmie ? client.createdAtOmie.toISOString() : null,
      updatedAtOmie: client.updatedAtOmie ? client.updatedAtOmie.toISOString() : null,
    });
  }
}