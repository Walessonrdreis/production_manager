import type { FastifyReply, FastifyRequest } from "fastify";
import { sendPaginated } from "@/shared/http/response";

type Querystring = {
  page?: string;
  pageSize?: string;
  hasStructure?: string;
  q?: string;
};

export async function listProductStructuresController(
  req: FastifyRequest<{ Querystring: Querystring }>,
  reply: FastifyReply
) {
  if (!req.server.productStructure) {
    req.log.error("[list-product-structures] productStructure module NOT registered");
    return reply.code(500).send({
      message: "Módulo product-structure não registrado",
      code: "MODULE_NOT_REGISTERED",
    });
  }

  try {
    const page = req.query.page ? Math.max(1, Number(req.query.page)) : 1;
    const pageSize = req.query.pageSize
      ? Math.min(100, Math.max(1, Number(req.query.pageSize)))
      : 20;
    const hasStructure =
      req.query.hasStructure !== undefined
        ? req.query.hasStructure === "true"
        : undefined;
    const q = req.query.q?.trim() || undefined;

    const result = await req.server.productStructure.listUseCase.execute({
      page,
      pageSize,
      hasStructure,
      q,
    });

    return sendPaginated(req, reply, result.data, {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages,
    });
  } catch (e: any) {
    req.log?.error?.({ err: e, message: e?.message }, "list product-structures failed");
    return reply.code(500).send({
      message: e?.message || "Erro interno ao listar estruturas de produtos",
      code: "INTERNAL_ERROR",
      error: process.env.NODE_ENV !== "production" ? e?.message : undefined,
    });
  }
}
