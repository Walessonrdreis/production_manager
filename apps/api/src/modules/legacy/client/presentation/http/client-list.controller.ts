import { FastifyReply, FastifyRequest } from "fastify";

type Query = {
  page?: string;
  pageSize?: string;
  q?: string;
};

export class ClientListController {
  async list(
    request: FastifyRequest<{ Querystring: Query }>,
    reply: FastifyReply
  ) {
    const page = Math.max(Number(request.query.page ?? 1), 1);
    const pageSize = Math.min(Number(request.query.pageSize ?? 20), 100);
    const q = request.query.q?.trim();

    const result = await request.server.listClientsUseCase.execute({
      page,
      pageSize,
      q,
    });

    return reply.send({
      page,
      pageSize,
      total: result.total,
      data: result.data.map((c) => ({
        omieClientCode: c.omieClientCode.toString(),
        legalName: c.legalName,
        tradeName: c.tradeName,
        document: c.document,
        personType: c.personType,
        email: c.email,
        phone: c.phone,
        isActive: c.isActive,
        isBlocked: c.isBlocked,
      })),
    });
  }
}