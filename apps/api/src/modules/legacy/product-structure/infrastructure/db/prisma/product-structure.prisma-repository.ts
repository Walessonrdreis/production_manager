import type { PrismaClient } from "@prisma/client";
import { ProductStructureRepository, UpsertStructureInput, ProductStructurePersistenceModel, FindAllStructuresParams, FindAllStructuresResult } from "../../../application/ports/product-structure.repository";

export class ProductStructurePrismaRepository implements ProductStructureRepository {
  constructor(private prisma: PrismaClient) {}

  async findByCodProduto(codProduto: string): Promise<ProductStructurePersistenceModel | null> {
    return (await this.prisma.productStructure.findUnique({
      where: { codProduto },
      include: { items: true },
    })) as any;
  }

  async upsertStructureWithItems(input: UpsertStructureInput): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.productStructure.upsert({
        where: { codProduto: input.codProduto },
        create: {
          codProduto: input.codProduto,
          descrProduto: input.descrProduto ?? null,
          codFamilia: input.codFamilia ?? null,
          descrFamilia: input.descrFamilia ?? null,
          tipoProduto: input.tipoProduto ?? null,
          unidProduto: input.unidProduto ?? null,
          pesoBruto: input.pesoBruto ?? null,
          pesoLiquido: input.pesoLiquido ?? null,
          hasStructure: input.hasStructure,
          idProdutoOmie: input.idProdutoOmie ?? null,
          intProdutoOmie: input.intProdutoOmie ?? null,
          structureHash: input.structureHash ?? null,
        },
        update: {
          descrProduto: input.descrProduto ?? null,
          codFamilia: input.codFamilia ?? null,
          descrFamilia: input.descrFamilia ?? null,
          tipoProduto: input.tipoProduto ?? null,
          unidProduto: input.unidProduto ?? null,
          pesoBruto: input.pesoBruto ?? null,
          pesoLiquido: input.pesoLiquido ?? null,
          hasStructure: input.hasStructure,
          idProdutoOmie: input.idProdutoOmie ?? null,
          intProdutoOmie: input.intProdutoOmie ?? null,
          structureHash: input.structureHash ?? null,
        },
      });

      // Estratégia simples, determinística e idempotente:
      // substitui itens quando houver mudança (controlado pelo hash no use case)
      await tx.productStructureItem.deleteMany({
        where: { codProdutoPai: input.codProduto },
      });

      if (input.items.length > 0) {
        await tx.productStructureItem.createMany({
          data: input.items.map((i) => ({
            codProdutoPai: input.codProduto,
            codProdutoComponente: i.codProdutoComponente,
            descrProdutoComponente: i.descrProdutoComponente ?? null,
            codFamiliaComponente: i.codFamiliaComponente ?? null,
            descrFamiliaComponente: i.descrFamiliaComponente ?? null,
            quantidade: i.quantidade,
            unidade: i.unidade ?? null,
            tipoProdutoComponente: i.tipoProdutoComponente ?? null,
            percentualPerda: i.percentualPerda ?? null,
            idMalhaOmie: i.idMalhaOmie ?? null,
          })),
          skipDuplicates: true,
        });
      }
    });
  }

  async findAll(params: FindAllStructuresParams): Promise<FindAllStructuresResult> {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (params.hasStructure !== undefined) {
      where.hasStructure = params.hasStructure;
    }

    if (params.q?.trim()) {
      where.codProduto = { contains: params.q.trim(), mode: "insensitive" };
    }

    const [data, total] = await Promise.all([
      this.prisma.productStructure.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { updatedAt: "desc" },
        include: { items: true },
      }),
      this.prisma.productStructure.count({ where }),
    ]);

    const totalNumber = Number(total);

    return {
      data: data as any,
      total: totalNumber,
      page,
      pageSize,
      totalPages: Math.ceil(totalNumber / pageSize),
    };
  }
}