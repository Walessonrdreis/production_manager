/**
 * Contratos do endpoint:
 * POST /api/v1/geral/malha/
 *
 * Call observado na sua conta:
 * - ListarEstruturas
 *
 * Resposta observada:
 * - produtosEncontrados: [{ ident, itens, ... }]
 * - campos de paginação: nPagina, nTotPaginas, nRegistros, nTotRegistros
 */

export type OmieMalhaIdent = {
  codProduto: string;
  descrProduto?: string;
  codFamilia?: string;
  descrFamilia?: string;

  idProduto?: number;
  idFamilia?: number;

  tipoProduto?: string;
  unidProduto?: string;

  pesoBrutoProduto?: number;
  pesoLiqProduto?: number;

  // algumas contas podem retornar isso
  intProduto?: string;
};

export type OmieMalhaItem = {
  codProdMalha: string;
  descrProdMalha?: string;

  codFamMalha?: string;
  descrFamMalha?: string;

  quantProdMalha: number;
  unidProdMalha?: string;

  tipoProdMalha?: string;
  percPerdaProdMalha?: number;

  idMalha?: number;
  idProdMalha?: number;
  idFamMalha?: number;

  // campos extras que podem vir (não usamos, mas não queremos quebrar)
  dAltProdMalha?: string;
  dIncProdMalha?: string;
  hAltProdMalha?: string;
  hIncProdMalha?: string;
  uAltProdMalha?: string;
  uIncProdMalha?: string;
  pesoBrutoProdMalha?: number;
  pesoLiqProdMalha?: number;
};

export type OmieEstrutura = {
  ident: OmieMalhaIdent;
  itens?: OmieMalhaItem[];

  // extras observados
  custoProducao?: any;
  observacoes?: any;
};

export type OmieListarEstruturasResponse = {
  // paginação (observado)
  nPagina?: number;
  nTotPaginas?: number;
  nRegistros?: number;
  nTotRegistros?: number;

  // ✅ chave observada na sua conta
  produtosEncontrados?: OmieEstrutura[];

  // fallbacks (outras variações possíveis)
  listaEstruturas?: OmieEstrutura[];
  estruturas?: OmieEstrutura[];
  lista?: OmieEstrutura[];

  // erros
  faultcode?: string;
  faultstring?: string;
  status?: "error" | "ok";
  message?: string;
};