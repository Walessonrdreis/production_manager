// ---------------------------------------------------------------------------
// Port — Produção de página de ordens de produção (Omie → nosso DB)
// ---------------------------------------------------------------------------
// Segue o mesmo padrão de ProductStructureFetchPageGateway.
// ---------------------------------------------------------------------------

export type ProductionOrderSyncPageItem = {
    /** nCodOP (Omie) */
    omieCode: string;
    /** cNumOP (Omie) — ex: "2025/01535" */
    number: string;
    /** cCodIntOP — código de integração */
    internalCode: string | null;
    /** nCodProduto — código do produto no Omie */
    productCode: number;
    /** nQtde — quantidade */
    quantity: number;
    /** cEtapa — estágio da OP (ex: "40", "60", "80") */
    stage: string | null;
    /** cConcluida — "S" | "N" */
    completed: boolean;
    /** dDtPrevisao — data prevista */
    forecastDate: string | null;
    /** dDtConclusao — data de conclusão */
    completionDate: string | null;
    /** dDtInicio — data de início */
    startDate: string | null;
    /** código do local de estoque */
    stockLocationCode: number | null;
    /** payload bruto da Omie (para auditoria) */
    raw: any;
};

export type ProductionOrderSyncPageInput = {
    page: number;
    pageSize: number;
    /** Se informado, filtra por data de conclusão >= updatedSince (incremental) */
    updatedSince?: Date;
};

export type ProductionOrderSyncPageResult = {
    items: ProductionOrderSyncPageItem[];
    hasNextPage: boolean;
    totalPages: number | null;
    currentPage: number;
};

export interface ProductionOrderSyncPageGateway {
    fetchPage(
        input: ProductionOrderSyncPageInput
    ): Promise<ProductionOrderSyncPageResult>;
}
