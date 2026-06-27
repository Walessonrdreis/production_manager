// ---------------------------------------------------------------------------
// Port — Production Order Update Gateway
// ---------------------------------------------------------------------------
// Define o contrato para atualização de OP no Omie.
// Implementações: RealProductionOrderUpdateGateway (Omie),
//                 FakeProductionOrderUpdateGateway (simulação)
// ---------------------------------------------------------------------------

export type UpdateProductionOrderCommand = {
    externalRequestId: string;
    omieId: string;
    quantity?: number;
    forecastDate?: string;
    notes?: string;
};

export interface ProductionOrderUpdateGateway {
    updateProductionOrder(
        command: UpdateProductionOrderCommand
    ): Promise<{
        externalRequestId: string;
        status: "ACCEPTED" | "CONFIRMED" | "FAILED";
    }>;
}
