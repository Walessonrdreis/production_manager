export type ProductStructureItemOutput = {
  codProdutoComponente: string;
  descrProdutoComponente?: string | null;
  codFamiliaComponente?: string | null;
  descrFamiliaComponente?: string | null;
  quantidade: number;
  unidade?: string | null;
  tipoProdutoComponente?: string | null;
  percentualPerda?: number | null;
  idMalhaOmie?: number | null;
};

export type ProductStructureOutput = {
  codProduto: string;
  descrProduto?: string | null;
  codFamilia?: string | null;
  descrFamilia?: string | null;
  tipoProduto?: string | null;
  unidProduto?: string | null;
  pesoBruto?: number | null;
  pesoLiquido?: number | null;
  hasStructure: boolean;

  // referências de integração (não são chave do domínio)
  idProdutoOmie?: number | null;
  intProdutoOmie?: string | null;

  items: ProductStructureItemOutput[];

  createdAt: string; // ISO
  updatedAt: string; // ISO
};