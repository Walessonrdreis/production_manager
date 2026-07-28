// ---------------------------------------------------------------------------
// Port — Product Update Gateway
// ---------------------------------------------------------------------------
// Define o contrato para alterar produto no Omie (AlterarProduto).
// ---------------------------------------------------------------------------

export type UpdateProductCommand = {
    externalRequestId: string;
    productCode: string;
    description?: string;
    sku?: string;
    familyDescription?: string;
    brand?: string;
    unit?: string;
    ncm?: string;
};

export interface ProductUpdateGateway {
    update(
        command: UpdateProductCommand
    ): Promise<{
        externalRequestId: string;
        productCode: string;
        status: "ACCEPTED" | "CONFIRMED" | "FAILED";
    }>;
}
