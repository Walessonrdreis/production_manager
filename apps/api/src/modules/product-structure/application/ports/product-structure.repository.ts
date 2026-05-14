export type UpsertStructureInput = {
  codProduto: string;
  descrProduto?: string;
  codFamilia?: string;
  descrFamilia?: string;
  tipoProduto?: string;
  unidProduto?: string;
  pesoBruto?: number;
  pesoLiquido?: number;
  hasStructure: boolean;

  // referências Omie
  idProdutoOmie?: number | null;
  intProdutoOmie?: string | null;

  // idempotência
  structureHash?: string | null;

  items: Array<{
    codProdutoComponente: string;
    descrProdutoComponente?: string;
    codFamiliaComponente?: string;
    descrFamiliaComponente?: string;
    quantidade: number;
    unidade?: string;
    tipoProdutoComponente?: string;
    percentualPerda?: number;
    idMalhaOmie?: number | null;
  }>;
};

export type ProductStructurePersistenceModel = {
  codProduto: string;
  descrProduto: string | null;
  codFamilia: string | null;
  descrFamilia: string | null;
  tipoProduto: string | null;
  unidProduto: string | null;
  pesoBruto: any | null; // Decimal no Prisma
  pesoLiquido: any | null; // Decimal no Prisma
  hasStructure: boolean;
  idProdutoOmie: number | null;
  intProdutoOmie: string | null;
  structureHash: string | null;
  createdAt: Date;
  updatedAt: Date;
  items: Array<{
    codProdutoPai: string;
    codProdutoComponente: string;
    descrProdutoComponente: string | null;
    codFamiliaComponente: string | null;
    descrFamiliaComponente: string | null;
    quantidade: any; // Decimal no Prisma
    unidade: string | null;
    tipoProdutoComponente: string | null;
    percentualPerda: any | null; // Decimal no Prisma
    idMalhaOmie: number | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
};

export type FindAllStructuresParams = {
  page?: number;
  pageSize?: number;
  hasStructure?: boolean;
  q?: string;
};

export type FindAllStructuresResult = {
  data: ProductStructurePersistenceModel[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export interface ProductStructureRepository {
  findByCodProduto(codProduto: string): Promise<ProductStructurePersistenceModel | null>;
  upsertStructureWithItems(input: UpsertStructureInput): Promise<void>;
  findAll(params: FindAllStructuresParams): Promise<FindAllStructuresResult>;
}