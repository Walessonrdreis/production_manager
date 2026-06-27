// ---------------------------------------------------------------------------
// Port — Production Order Consult Gateway
// ---------------------------------------------------------------------------
// Consulta uma única OP no Omie (ConsultarOrdemProducao) e retorna dados
// frescos. Usado pela rota de refresh síncrono.
// ---------------------------------------------------------------------------

export type ProductionOrderConsultResult = {
    omieId: string;
    internalCode: string | null;
    orderNumber: string | null;
    productCode: string | null;
    productIntegrationCode: string | null;
    quantity: string;
    forecastDate: string | null;
    startDate: string | null;
    completionDate: string | null;
    stage: string | null;
    projectCode: string | null;
    completed: boolean;
    active: boolean;
    /** Payload bruto da Omie para usar no sync store */
    rawPayload: any;
    items: Array<{
        omieItemCode: string;
        productMeshId: number | null;
        useFromStock: string | null;
        quantity: string | null;
        stockLocationCode: number | null;
        observation: string | null;
    }>;
};

export interface ProductionOrderConsultGateway {
    consult(omieId: string): Promise<ProductionOrderConsultResult | null>;
}
