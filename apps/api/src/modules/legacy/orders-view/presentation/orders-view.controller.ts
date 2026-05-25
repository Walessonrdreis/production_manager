import { FastifyReply, FastifyRequest } from "fastify";

export class OrdersViewController {
  async list(
    request: FastifyRequest<{ Querystring: { page?: string; pageSize?: string } }>,
    reply: FastifyReply
  ) {
    const page = Math.max(Number(request.query.page ?? 1), 1);
    const pageSize = Math.min(Math.max(Number(request.query.pageSize ?? 20), 1), 100);

    const data = await request.server.ordersViewUseCase.execute({ page, pageSize });
    return reply.send(data);
  }
}