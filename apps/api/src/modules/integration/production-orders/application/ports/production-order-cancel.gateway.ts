// ---------------------------------------------------------------------------
// Port — Production Order Cancel Gateway
// ---------------------------------------------------------------------------
// Define o contrato para cancelamento de OP no Omie.
// Implementações: RealProductionOrderCancelGateway (Omie),
//                 FakeProductionOrderCancelGateway (simulação)
// ---------------------------------------------------------------------------

export type CancelProductionOrderCommand = {
    externalRequestId: string;
    omieId: string;
    reason?: string;
};

export interface ProductionOrderCancelGateway {
    cancelProductionOrder(
        command: CancelProductionOrderCommand
    ): Promise<{
        externalRequestId: string;
        status: "ACCEPTED" | "CONFIRMED" | "FAILED";
    }>;
}
