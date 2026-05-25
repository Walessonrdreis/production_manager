import { ProductStructureOutput, ProductStructureItemOutput } from "../dtos/product-structure.output";
import { ProductStructureRepository } from "../ports/product-structure.repository";

type ListInput = {
  page?: number;
  pageSize?: number;
  hasStructure?: boolean;
  q?: string;
};

type ListOutput = {
  data: ProductStructureOutput[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

type Deps = {
  repository: ProductStructureRepository;
};

export class ListProductStructuresUseCase {
  constructor(private deps: Deps) {}

  async execute(input: ListInput): Promise<ListOutput> {
    const result = await this.deps.repository.findAll({
      page: input.page,
      pageSize: input.pageSize,
      hasStructure: input.hasStructure,
      q: input.q,
    });

    const data: ProductStructureOutput[] = result.data.map((found) => ({
      codProduto: found.codProduto,
      descrProduto: found.descrProduto,
      codFamilia: found.codFamilia,
      descrFamilia: found.descrFamilia,
      tipoProduto: found.tipoProduto,
      unidProduto: found.unidProduto,
      pesoBruto: found.pesoBruto ? Number(found.pesoBruto) : null,
      pesoLiquido: found.pesoLiquido ? Number(found.pesoLiquido) : null,
      hasStructure: found.hasStructure,

      idProdutoOmie: found.idProdutoOmie ? Number(found.idProdutoOmie) : null,
      intProdutoOmie: found.intProdutoOmie,

      items: (found.items ?? []).map((i): ProductStructureItemOutput => ({
        codProdutoComponente: i.codProdutoComponente,
        descrProdutoComponente: i.descrProdutoComponente,
        codFamiliaComponente: i.codFamiliaComponente,
        descrFamiliaComponente: i.descrFamiliaComponente,
        quantidade: i.quantidade ? Number(i.quantidade) : 0,
        unidade: i.unidade,
        tipoProdutoComponente: i.tipoProdutoComponente,
        percentualPerda: i.percentualPerda ? Number(i.percentualPerda) : null,
        idMalhaOmie: i.idMalhaOmie ? Number(i.idMalhaOmie) : null,
      })),

      createdAt: found.createdAt.toISOString(),
      updatedAt: found.updatedAt.toISOString(),
    }));

    return {
      data,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
    };
  }
}
