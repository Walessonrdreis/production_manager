// ---------------------------------------------------------------------------
// Use Case — Enqueue Cancel Production Order
// ---------------------------------------------------------------------------
// Segue o padrão de SyncProductStructureUseCase.
// - noWrite (fake) → executa direto, sem tracking
// - Real → enfileira no PgBoss e retorna 202
// ---------------------------------------------------------------------------

import { enqueueJob } from "@/shared/infra/job-queue";

export type EnqueueCancelProductionOrderCommand = {
    externalRequestId: string;
    omieId: string;
    reason?: string;
};

export type EnqueueCancelProductionOrderResult = {
    status: "PENDING";
    externalRequestId: string;
};

export class EnqueueCancelProductionOrderUseCase {
    constructor(
        private readonly options: { noWrite?: boolean } = {}
    ) { }

    async execute(command: EnqueueCancelProductionOrderCommand): Promise<EnqueueCancelProductionOrderResult> {
        if (this.options.noWrite) {
            return { status: "PENDING", externalRequestId: command.externalRequestId };
        }

        await enqueueJob("production-order.cancel-op", {
            externalRequestId: command.externalRequestId,
            omieId: command.omieId,
            reason: command.reason,
        }, {
            retryLimit: 5,
            retryBackoff: true,
            singletonKey: `production-order-cancel-${command.externalRequestId}`,
        });

        return { status: "PENDING", externalRequestId: command.externalRequestId };
    }
}
