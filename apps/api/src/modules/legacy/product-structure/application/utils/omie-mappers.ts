import { OmieProductStructureResult } from "../ports/omie-product-structure.gateway";
import { UpsertStructureInput } from "../ports/product-structure.repository";

export function mapOmieToUpsertInput(omie: OmieProductStructureResult): Omit<UpsertStructureInput, "structureHash"> {
  const parent = omie.parent;

  // Regra crítica: domínio normalizado sempre para codProduto
  const codProduto = (parent.codProduto ?? "").trim();
  if (!codProduto) {
    const err = new Error("Omie retornou estrutura sem codProduto no ident.");
    (err as any).code = "INTEGRATION_ERROR";
    throw err;
  }

  const items = (omie.items ?? [])
    .filter((i) => (i.codProdMalha ?? "").trim().length > 0)
    .map((i) => ({
      codProdutoComponente: i.codProdMalha.trim(),
      descrProdutoComponente: i.descrProdMalha,
      codFamiliaComponente: i.codFamMalha,
      descrFamiliaComponente: i.descrFamMalha,
      quantidade: Number(i.quantProdMalha ?? 0),
      unidade: i.unidProdMalha,
      tipoProdutoComponente: i.tipoProdMalha,
      percentualPerda: i.percPerdaProdMalha,
      idMalhaOmie: i.idMalha ?? null,
    }));

  return {
    codProduto,
    descrProduto: parent.descrProduto,
    codFamilia: parent.codFamilia,
    descrFamilia: parent.descrFamilia,
    tipoProduto: parent.tipoProduto,
    unidProduto: parent.unidProduto,
    pesoBruto: parent.pesoBrutoProduto,
    pesoLiquido: parent.pesoLiqProduto,
    hasStructure: items.length > 0,

    idProdutoOmie: parent.idProduto ?? null,
    intProdutoOmie: parent.intProduto ?? null,

    items,
  };
}