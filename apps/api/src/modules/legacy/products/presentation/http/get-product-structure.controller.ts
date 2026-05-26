import { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "@/infra/db";

/**
 * READ MODEL
 * Retorna a estrutura (BOM) de um produto Omie
 * - NÃO escreve
 * - NÃO chama Omie
 * - Produto "possui" estrutura por composição lógica
 */
export async function getProductStructureController(
  request: FastifyRequest<{ Params: { omieCode: string } }>,
  reply: FastifyReply
) {
  const { omieCode } = request.params;

  const structure = await prisma.productStructure.findUnique({
    where: {
      codProduto: omieCode,
    },
    select: {
      codProduto: true,
      descrProduto: true,
      items: {
        select: {
          codProdutoComponente: true,
          descrProdutoComponente: true,
          quantidade: true,
          unidade: true,
          percentualPerda: true,
        },
        orderBy: {
          codProdutoComponente: "asc",
        },
      },
    },
  });

  if (!structure) {
    return reply.code(404).send({
      error: "STRUCTURE_NOT_FOUND",
      message: "Produto não possui estrutura cadastrada",
    });
  }

  return reply.send({
    omieCode: structure.codProduto,
    description: structure.descrProduto,
    items: structure.items,
  });
}