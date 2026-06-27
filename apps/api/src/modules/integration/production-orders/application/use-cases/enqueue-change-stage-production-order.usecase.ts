// ---------------------------------------------------------------------------
// Use Case — Enqueue Change Production Order Stage
// ---------------------------------------------------------------------------
// Segue o padrão de SyncProductStructureUseCase.
// - noWrite (fake) → executa direto, sem tracking
// - Real → enfileira no PgBoss e retorna 202
// ---------------------------------------------------------------------------

import { enqueueJob } from "@/shared/infra/job-queue";

export type EnqueueChangeStageProductionOrderCommand = {
    externalRequestId: string;
    omieId: string;
    stage: string;
};

export type EnqueueChangeStageProductionOrderResult = {
    status: "PENDING";
    externalRequestId: string;
};

export class EnqueueChangeStageProductionOrderUseCase {
    constructor(
        private readonly options: { noWrite?: boolean } = {}
    ) { }

    async execute(command: EnqueueChangeStageProductionOrderCommand): Promise<EnqueueChangeStageProductionOrderResult> {
        if (this.options.noWrite) {
            return { status: "PENDING", externalRequestId: command.externalRequestId };
        }

        await enqueueJob("production-order.change-stage", {
            externalRequestId: command.externalRequestId,
            omieId: command.omieId,
            stage: command.stage,
        }, {
            retryLimit: 5,
            retryBackoff: true,
            singletonKey: `production-order-change-stage-${command.externalRequestId}`,
        });

        return { status: "PENDING", externalRequestId: command.externalRequestId };
    }
}
