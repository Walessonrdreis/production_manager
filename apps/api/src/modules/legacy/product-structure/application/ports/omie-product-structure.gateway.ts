export type ProductIdentifierInput = {
  codProduto?: string;
  idProduto?: number;
  intProduto?: string;
};

export type OmieProductStructureResult = {
  parent: {
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
    intProduto?: string;
  };
  items: Array<{
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
  }>;
};

export interface OmieProductStructureGateway {
  fetchStructure(input: ProductIdentifierInput): Promise<OmieProductStructureResult>;
}