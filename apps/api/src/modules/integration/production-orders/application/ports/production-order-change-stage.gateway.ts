// ---------------------------------------------------------------------------
// Port — Production Order Change Stage Gateway
// ---------------------------------------------------------------------------
// Define o contrato para alteração de etapa de OP no Omie.
// Implementações: RealProductionOrderChangeStageGateway (Omie),
//                 FakeProductionOrderChangeStageGateway (simulação)
// ---------------------------------------------------------------------------

export type ChangeProductionOrderStageCommand = {
    externalRequestId: string;
    omieId: string;
    stage: string;
};

export interface ProductionOrderChangeStageGateway {
    changeStage(
        command: ChangeProductionOrderStageCommand
    ): Promise<{
        externalRequestId: string;
        status: "ACCEPTED" | "CONFIRMED" | "FAILED";
    }>;
}
