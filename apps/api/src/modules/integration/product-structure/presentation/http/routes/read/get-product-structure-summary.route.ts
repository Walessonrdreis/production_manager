import type { FastifyInstance } from "fastify";
import { prisma } from "@/shared/db/prisma";
import { ProductStructureCommandStore } from "../../../../infrastructure/db/product-structure-command.store";
import { mapProductStructureToSummary } from "../../../../application/mappers/map-product-structure-to-summary";

export function registerGetProductStructureSummaryRoute(app: FastifyInstance) {
    app.get(
        "/v1/integration/product-structure/read/summary",
        {
            schema: {
                tags: ["product-structure"],
                summary: "Sumário de estruturas espelhadas",
                description:
                    "Retorna lista resumida dos produtos com estrutura, status de sincronização e contagem de itens.",
                querystring: {
                    type: "object",
                    properties: {
                        onlyWithStructure: { type: "boolean", default: false },
                        q: { type: "string" },
                        limit: { type: "number", default: 50 },
                        offset: { type: "number", default: 0 },
                    },
                },
            },
        },
        async (request, reply) => {
            const query = request.query as any;
            const onlyWithStructure = query?.onlyWithStructure === true || query?.onlyWithStructure === "true";
            const q = query?.q ? String(query.q).trim() : null;
            const limit = Math.min(Math.max(1, Number(query?.limit ?? 50)), 500);
            const offset = Math.max(0, Number(query?.offset ?? 0));

            const where: any = {};

            if (onlyWithStructure) {
                where.hasStructure = true;
            }

            if (q) {
                where.OR = [
                    { codProduto: { contains: q, mode: "insensitive" } },
                    { descrProduto: { contains: q, mode: "insensitive" } },
                ];
            }

            const [rows, total] = await Promise.all([
                prisma.productStructure.findMany({
                    where,
                    select: {
                        codProduto: true,
                        descrProduto: true,
                        codFamilia: true,
                        descrFamilia: true,
                        tipoProduto: true,
                        unidProduto: true,
                        hasStructure: true,
                        updatedAt: true,
                        _count: { select: { items: true } },
                    },
                    orderBy: { codProduto: "asc" },
                    take: limit,
                    skip: offset,
                }),
                prisma.productStructure.count({ where }),
            ]);

            const commandStore = new ProductStructureCommandStore(prisma);
            const [accepted, confirmed, failed] = await Promise.all([
                commandStore.countByStatus("ACCEPTED"),
                commandStore.countByStatus("CONFIRMED"),
                commandStore.countByStatus("FAILED"),
            ]);

            return reply.send({
                success: true,
                data: {
                    summary: {
                        total,
                        withStructure: rows.filter((r) => r.hasStructure).length,
                        withoutStructure: rows.filter((r) => !r.hasStructure).length,
                        commands: { accepted, confirmed, failed },
                    },
                    meta: {
                        limit,
                        offset,
                        returned: rows.length,
                    },
                    items: rows.map(mapProductStructureToSummary),
                },
            });
        }
    );
}
