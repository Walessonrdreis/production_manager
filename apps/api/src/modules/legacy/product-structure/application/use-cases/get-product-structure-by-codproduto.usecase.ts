import { ProductStructureOutput } from "../dtos/product-structure.output";
import { ProductStructureRepository } from "../ports/product-structure.repository";

type Deps = {
  repository: ProductStructureRepository;
};

export class GetProductStructureByCodProdutoUseCase {
  constructor(private deps: Deps) {}

  async execute(codProduto: string): Promise<ProductStructureOutput> {
    const normalized = (codProduto ?? "").trim();
    if (!normalized) {
      const err = new Error("codProduto é obrigatório.");
      (err as any).code = "VALIDATION_ERROR";
      throw err;
    }

    const found = await this.deps.repository.findByCodProduto(normalized);
    if (!found) {
      const err = new Error(`Estrutura não encontrada para codProduto: ${normalized}`);
      (err as any).code = "NOT_FOUND";
      throw err;
    }

    return {
      codProduto: found.codProduto,
      descrProduto: found.descrProduto,
      codFamilia: found.codFamilia,
      descrFamilia: found.descrFamilia,
      tipoProduto: found.tipoProduto,
      unidProduto: found.unidProduto,
      pesoBruto: found.pesoBruto ? Number(found.pesoBruto) : null,
      pesoLiquido: found.pesoLiquido ? Number(found.pesoLiquido) : null,
      hasStructure: found.hasStructure,

      idProdutoOmie: found.idProdutoOmie,
      intProdutoOmie: found.intProdutoOmie,

      items: (found.items ?? []).map((i) => ({
        codProdutoComponente: i.codProdutoComponente,
        descrProdutoComponente: i.descrProdutoComponente,
        codFamiliaComponente: i.codFamiliaComponente,
        descrFamiliaComponente: i.descrFamiliaComponente,
        quantidade: i.quantidade ? Number(i.quantidade) : 0,
        unidade: i.unidade,
        tipoProdutoComponente: i.tipoProdutoComponente,
        percentualPerda: i.percentualPerda ? Number(i.percentualPerda) : null,
        idMalhaOmie: i.idMalhaOmie,
      })),

      createdAt: found.createdAt.toISOString(),
      updatedAt: found.updatedAt.toISOString(),
    };
  }
}