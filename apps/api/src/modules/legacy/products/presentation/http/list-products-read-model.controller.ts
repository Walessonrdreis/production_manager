import { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "@/infra/db";

/**
 * READ MODEL
 * Lista produtos Omie com informações derivadas de estrutura (BOM)
 * - NÃO escreve
 * - NÃO chama Omie
 * - NÃO aplica regra de domínio mutável
 */
export async function listProductsReadModelController(
  _request: FastifyRequest,
  reply: FastifyReply
) {
  // 1️⃣ Produtos Omie (fonte da verdade)
  const products = await prisma.omieProduct.findMany({
    select: {
      omieCode: true,
      description: true,
      familyDescription: true,
      active: true,
    },
    orderBy: {
      description: "asc",
    },
  });

  // 2️⃣ Estruturas existentes (somente leitura)
  const structures = await prisma.productStructure.findMany({
    select: {
      codProduto: true,
      items: {
        select: { id: true },
      },
    },
  });

  // 3️⃣ Mapa para lookup rápido
  const structureMap = new Map<string, number>(
    structures.map((s) => [s.codProduto, s.items.length])
  );

  // 4️⃣ Read Model final
  const readModel = products.map((product) => {
    const itemsCount = structureMap.get(product.omieCode) ?? 0;
    const hasStructure = itemsCount > 0;

    return {
      omieCode: product.omieCode,
      description: product.description,
      familyDescription: product.familyDescription,
      active: product.active,

      hasStructure,
      structureItemsCount: itemsCount,

      // ✅ regra derivada (não persistida)
      canCreateProductionOrder: product.active && hasStructure,
    };
  });

  return reply.send({
    data: readModel,
  });
}