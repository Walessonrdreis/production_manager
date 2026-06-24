// ---------------------------------------------------------------------------
// Port — Product Creation Gateway
// ---------------------------------------------------------------------------
// Define o contrato para criar produto no Omie (IncluirProduto).
// Implementações: RealProductCreationGateway (Omie),
//                 FakeProductCreationGateway (simulação)
// ---------------------------------------------------------------------------

export type CreateProductCommand = {
    externalRequestId: string;
    description: string;
    sku?: string;
    familyDescription?: string;
    brand?: string;
    unit?: string;
    ncm?: string;
};

export interface ProductCreationGateway {
    create(
        command: CreateProductCommand
    ): Promise<{
        externalRequestId: string;
        productCode: string;
        status: "ACCEPTED" | "CONFIRMED" | "FAILED";
    }>;
}
