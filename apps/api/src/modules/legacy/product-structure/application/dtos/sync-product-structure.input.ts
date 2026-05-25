export type SyncProductStructureInput = {
  /**
   * Entrada flexível (Omie):
   * - Exigir ao menos um
   * - Prioridade interna: codProduto > idProduto > intProduto
   */
  codProduto?: string;
  idProduto?: number;
  intProduto?: string;
};

export type SyncProductStructureResult = {
  codProduto: string;
  hasStructure: boolean;
  /**
   * updated=false indica idempotência (sem mudanças)
   */
  updated: boolean;
  /**
   * Quantidade de itens persistidos (0 se não há estrutura)
   */
  itemsCount: number;
};