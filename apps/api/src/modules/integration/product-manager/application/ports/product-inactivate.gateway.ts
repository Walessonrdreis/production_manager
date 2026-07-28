// ---------------------------------------------------------------------------
// Port — Product Inactivate Gateway
// ---------------------------------------------------------------------------
// Define o contrato para inativar produto no Omie (AlterarProduto ativo=false).
// ---------------------------------------------------------------------------

export type InactivateProductCommand = {
    externalRequestId: string;
    productCode: string;
};

export interface ProductInactivateGateway {
    inactivate(
        command: InactivateProductCommand
    ): Promise<{
        externalRequestId: string;
        productCode: string;
        status: "ACCEPTED" | "CONFIRMED" | "FAILED";
    }>;
}
