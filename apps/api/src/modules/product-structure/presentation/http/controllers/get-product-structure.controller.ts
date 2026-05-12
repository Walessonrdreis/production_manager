import type { FastifyReply, FastifyRequest } from "fastify";

type Params = {
  codProduto: string;
};

export async function getProductStructureController(
  req: FastifyRequest<{ Params: Params }>,
  reply: FastifyReply
) {
  try {
    const result = await req.server.productStructure.getByCodProdutoUseCase.execute(req.params.codProduto);
    return reply.code(200).send(result);
  } catch (e: any) {
    const code = e?.code;

    if (code === "VALIDATION_ERROR") {
      return reply.code(400).send({ message: e.message, code });
    }

    if (code === "NOT_FOUND") {
      return reply.code(404).send({ message: e.message, code });
    }

    req.log?.error?.({ err: e }, "get product-structure failed");
    return reply.code(500).send({ message: "Erro interno", code: "INTERNAL_ERROR" });
  }
}