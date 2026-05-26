import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "@/infra/db";

/**
 * READ MODEL (DB-only)
 * Produto Omie + flags derivadas de estrutura (BOM)
 * - NÃO escreve
 * - NÃO chama Omie
 */
export async function registerProductsReadModelRoutes(app: FastifyInstance) {
  // GET /v1/admin/read/products
  app.get(
    "/v1/admin/read/products",
    async (
      request: FastifyRequest<{ Querystring: { page?: string; pageSize?: string; q?: string } }>,
      reply: FastifyReply
    ) => {
      const page = Math.max(1, Number(request.query.page ?? 1));
      const pageSize = Math.min(200, Math.max(1, Number(request.query.pageSize ?? 50)));
      const q = String(request.query.q ?? "").trim();

      const where: any = {};
      if (q) {
        where.OR = [
          { description: { contains: q, mode: "insensitive" } },
          { omieCode: { contains: q, mode: "insensitive" } },
          { sku: { contains: q, mode: "insensitive" } },
        ];
      }

      const [total, products] = await Promise.all([
        prisma.omieProduct.count({ where }),
        prisma.omieProduct.findMany({
          where,
          orderBy: { description: "asc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
          select: {
            omieCode: true,
            description: true,
            familyDescription: true,
            sku: true,
            active: true,
            lastSyncAt: true,
          },
        }),
      ]);

      const codes = products.map((p) => p.omieCode);

      const structures = codes.length
        ? await prisma.productStructure.findMany({
            where: { codProduto: { in: codes } },
            select: {
              codProduto: true,
              _count: { select: { items: true } },
              updatedAt: true,
            },
          })
        : [];

      const structureMap = new Map<string, { itemsCount: number; updatedAt: string | null }>();
      for (const s of structures) {
        structureMap.set(s.codProduto, {
          itemsCount: s._count.items ?? 0,
          updatedAt: s.updatedAt ? s.updatedAt.toISOString() : null,
        });
      }

      const data = products.map((p) => {
        const s = structureMap.get(p.omieCode);
        const itemsCount = s?.itemsCount ?? 0;
        const hasStructure = itemsCount > 0;

        return {
          omieCode: p.omieCode,
          description: p.description,
          familyDescription: p.familyDescription,
          sku: p.sku,
          active: p.active,
          lastSyncAt: p.lastSyncAt?.toISOString?.() ?? null,

          hasStructure,
          structureItemsCount: itemsCount,
          structureUpdatedAt: s?.updatedAt ?? null,

          // regra derivada (não persistida)
          canCreateProductionOrder: Boolean(p.active && hasStructure),
        };
      });

      return reply.send({
        success: true,
        data,
        meta: { page, pageSize, total },
        links: {
          self: `/v1/admin/read/products?page=${page}&pageSize=${pageSize}${
            q ? `&q=${encodeURIComponent(q)}` : ""
          }`,
        },
      });
    }
  );

  // GET /v1/admin/read/products/:omieCode/structure
  app.get(
    "/v1/admin/read/products/:omieCode/structure",
    async (request: FastifyRequest<{ Params: { omieCode: string } }>, reply: FastifyReply) => {
      const { omieCode } = request.params;

      const structure = await prisma.productStructure.findUnique({
        where: { codProduto: omieCode },
        select: {
          codProduto: true,
          descrProduto: true,
          structureHash: true,
          updatedAt: true,
          items: {
            select: {
              codProdutoComponente: true,
              descrProdutoComponente: true,
              quantidade: true,
              unidade: true,
              percentualPerda: true,
              idMalhaOmie: true,
            },
            orderBy: { codProdutoComponente: "asc" },
          },
        },
      });

      if (!structure) {
        return reply.code(404).send({
          success: false,
          error: "STRUCTURE_NOT_FOUND",
          message: "Produto não possui estrutura cadastrada",
        });
      }

      return reply.send({
        success: true,
        data: {
          omieCode: structure.codProduto,
          description: structure.descrProduto ?? null,
          hasStructure: structure.items.length > 0,
          structureHash: structure.structureHash ?? null,
          updatedAt: structure.updatedAt?.toISOString?.() ?? null,
          items: structure.items.map((i) => ({
            codProdutoComponente: i.codProdutoComponente,
            descrProdutoComponente: i.descrProdutoComponente ?? null,
            quantidade: i.quantidade,
            unidade: i.unidade ?? null,
            percentualPerda: i.percentualPerda ?? null,
            idMalhaOmie: i.idMalhaOmie ?? null,
          })),
        },
      });
    }
  );
}