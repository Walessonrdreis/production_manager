// File: apps/api/src/modules/orders-enriched/presentation/http/orders-enriched.controller.ts

import { FastifyReply, FastifyRequest } from "fastify";

type Query = {
  page?: string;
  pageSize?: string;
  q?: string;
};

export class OrdersEnrichedController {
  async listStage20Enriched(
    request: FastifyRequest<{ Querystring: Query }>,
    reply: FastifyReply
  ) {
    const page = request.query.page ? Number(request.query.page) : undefined;
    const pageSize = request.query.pageSize ? Number(request.query.pageSize) : undefined;
    const q = request.query.q?.trim();

    const payload = await request.server.listStage20OrdersEnrichedUseCase.execute({
      page,
      pageSize,
      q,
    });

    return reply.code(200).send(payload);
  }
}