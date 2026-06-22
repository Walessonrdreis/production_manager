// ---------------------------------------------------------------------------
// Command Store — Production Order
// ---------------------------------------------------------------------------
// Segue exatamente o padrão de ProductStructureCommandStore.
// Responsável exclusivamente por:
// - idempotência por externalRequestId
// - tracking de status (ACCEPTED | CONFIRMED | FAILED)
// - auditoria mínima de comandos
// ---------------------------------------------------------------------------

import type { PrismaClient, ProductionOrderCommand } from "@prisma/client";
import { Prisma } from "@prisma/client";

export type CreateAcceptedCommandInput = {
    externalRequestId: string;
    commandType: "SYNC_GLOBAL";
    source?: "API2" | "JOB" | "ADMIN";
};

export class ProductionOrderCommandStore {
    constructor(private readonly prisma: PrismaClient) { }

    async findByExternalRequestId(
        externalRequestId: string
    ): Promise<ProductionOrderCommand | null> {
        return this.prisma.productionOrderCommand.findUnique({
            where: { externalRequestId },
        });
    }

    async getOrCreateAccepted(
        input: CreateAcceptedCommandInput
    ): Promise<{ record: ProductionOrderCommand; created: boolean }> {
        const existing = await this.findByExternalRequestId(input.externalRequestId);
        if (existing) {
            return { record: existing, created: false };
        }

        const record = await this.prisma.productionOrderCommand.create({
            data: {
                externalRequestId: input.externalRequestId,
                commandType: input.commandType,
                status: "ACCEPTED",
                source: input.source ?? "API2",
                executedAt: new Date(),
            },
        });

        return { record, created: true };
    }

    async markConfirmed(
        externalRequestId: string
    ): Promise<ProductionOrderCommand> {
        return this.prisma.productionOrderCommand.update({
            where: { externalRequestId },
            data: {
                status: "CONFIRMED",
                completedAt: new Date(),
                lastError: Prisma.DbNull,
            },
        });
    }

    async markFailed(
        externalRequestId: string,
        error: unknown
    ): Promise<ProductionOrderCommand> {
        const normalized =
            error instanceof Error
                ? {
                    message: error.message,
                    name: error.name,
                    stack: error.stack,
                }
                : { message: String(error) };

        return this.prisma.productionOrderCommand.update({
            where: { externalRequestId },
            data: {
                status: "FAILED",
                completedAt: new Date(),
                lastError: normalized as Prisma.InputJsonValue,
            },
        });
    }

    async countByStatus(
        status: "ACCEPTED" | "CONFIRMED" | "FAILED"
    ): Promise<number> {
        return this.prisma.productionOrderCommand.count({
            where: { status },
        });
    }
}
