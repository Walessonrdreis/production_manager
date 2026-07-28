// ---------------------------------------------------------------------------
// Use Case — Enqueue Create Production Order
// ---------------------------------------------------------------------------
// Segue o padrão de SyncProductStructureUseCase.
// - noWrite (fake) → executa direto, sem tracking
// - Real → enfileira no PgBoss e retorna 202
// ---------------------------------------------------------------------------

import { enqueueJob } from "@/shared/infra/job-queue";

export type EnqueueCreateProductionOrderCommand = {
    externalRequestId: string;
    productId: string;
    quantity: number;
    scheduledDate?: string;
    notes?: string;
};

export type EnqueueCreateProductionOrderResult = {
    status: "PENDING";
    externalRequestId: string;
};

export class EnqueueCreateProductionOrderUseCase {
    constructor(
        private readonly options: { noWrite?: boolean } = {}
    ) { }

    async execute(command: EnqueueCreateProductionOrderCommand): Promise<EnqueueCreateProductionOrderResult> {
        if (this.options.noWrite) {
            return { status: "PENDING", externalRequestId: command.externalRequestId };
        }

        await enqueueJob("production-order.create-op", {
            externalRequestId: command.externalRequestId,
            productId: command.productId,
            quantity: command.quantity,
            scheduledDate: command.scheduledDate,
            notes: command.notes,
        }, {
            retryLimit: 5,
            retryBackoff: true,
            singletonKey: `production-order-create-${command.externalRequestId}`,
        });

        return { status: "PENDING", externalRequestId: command.externalRequestId };
    }
}
