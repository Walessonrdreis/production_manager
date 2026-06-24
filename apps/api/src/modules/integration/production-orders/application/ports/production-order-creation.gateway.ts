// ---------------------------------------------------------------------------
// Port — Production Order Creation Gateway
// ---------------------------------------------------------------------------
// Define o contrato para criação de OP no Omie.
// Implementações: RealProductionOrderCreationGateway (Omie),
//                 FakeProductionOrderCreationGateway (simulação)
// ---------------------------------------------------------------------------

export type CreateProductionOrderCommand = {
    externalRequestId: string;
    productId: string;
    quantity: number;
    scheduledDate?: string;
    notes?: string;
};

export interface ProductionOrderCreationGateway {
    createProductionOrder(
        command: CreateProductionOrderCommand
    ): Promise<{
        externalRequestId: string;
        status: "ACCEPTED" | "CONFIRMED" | "FAILED";
    }>;
}
