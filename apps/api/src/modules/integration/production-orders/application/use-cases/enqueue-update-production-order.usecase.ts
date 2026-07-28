// ---------------------------------------------------------------------------
// Use Case — Enqueue Update Production Order
// ---------------------------------------------------------------------------
// Segue o padrão de SyncProductStructureUseCase.
// - noWrite (fake) → executa direto, sem tracking
// - Real → enfileira no PgBoss e retorna 202
// ---------------------------------------------------------------------------

import { enqueueJob } from "@/shared/infra/job-queue";

export type EnqueueUpdateProductionOrderCommand = {
    externalRequestId: string;
    omieId: string;
    quantity?: number;
    forecastDate?: string;
    notes?: string;
};

export type EnqueueUpdateProductionOrderResult = {
    status: "PENDING";
    externalRequestId: string;
};

export class EnqueueUpdateProductionOrderUseCase {
    constructor(
        private readonly options: { noWrite?: boolean } = {}
    ) { }

    async execute(command: EnqueueUpdateProductionOrderCommand): Promise<EnqueueUpdateProductionOrderResult> {
        if (this.options.noWrite) {
            return { status: "PENDING", externalRequestId: command.externalRequestId };
        }

        await enqueueJob("production-order.update-op", {
            externalRequestId: command.externalRequestId,
            omieId: command.omieId,
            quantity: command.quantity,
            forecastDate: command.forecastDate,
            notes: command.notes,
        }, {
            retryLimit: 5,
            retryBackoff: true,
            singletonKey: `production-order-update-${command.externalRequestId}`,
        });

        return { status: "PENDING", externalRequestId: command.externalRequestId };
    }
}
