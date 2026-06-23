// ---------------------------------------------------------------------------
// Port — Product Structure Consult Gateway
// ---------------------------------------------------------------------------
// Consulta uma única estrutura de produto no Omie (ConsultarEstrutura) e
// retorna dados frescos. Usado pela rota de refresh síncrono.
// Diferente do FetchGateway (que usa OmieHttpClientPort sem CB), este
// gateway usa OmieClientWithCircuitBreaker para resiliência.
// ---------------------------------------------------------------------------

export type ProductStructureConsultItem = {
    componentCode: string;
    description: string | null;
    familyCode: string | null;
    familyDescription: string | null;
    quantity: string;
    unit: string | null;
    loss: string | null;
    omieMeshId: string | null;
    productType: string | null;
};

export type ProductStructureConsultResult = {
    productCode: string;
    description: string | null;
    familyCode: string | null;
    familyDescription: string | null;
    productType: string | null;
    unit: string | null;
    grossWeight: number | null;
    netWeight: number | null;
    omieProductId: string | null;
    omieProductIntegrationId: string | null;
    hasStructure: boolean;
    items: ProductStructureConsultItem[];
    /** Payload bruto da Omie para usar no sync store */
    rawPayload: unknown;
};

export interface ProductStructureConsultGateway {
    consult(productCode: string): Promise<ProductStructureConsultResult | null>;
}
