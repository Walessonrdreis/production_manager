// ---------------------------------------------------------------------------
// Command Store — Product Manager
// ---------------------------------------------------------------------------
// Gerencia o ciclo de vida dos comandos: PENDING → PROCESSING → CONFIRMED / FAILED
// Idempotência via externalRequestId.
// ---------------------------------------------------------------------------

import type { PrismaClient, ProductManagerCommand } from "@prisma/client";

export type CommandType = "CREATE" | "UPDATE" | "INACTIVATE";
export type CommandStatus = "PENDING" | "PROCESSING" | "ACCEPTED" | "CONFIRMED" | "FAILED";
export type CommandSource = "API2" | "JOB" | "ADMIN";

export type EnqueueCommandInput = {
    externalRequestId: string;
    commandType: CommandType;
    productCode?: string;
    payload?: Record<string, unknown>;
    source?: CommandSource;
};

export class ProductManagerCommandStore {
    constructor(private readonly prisma: PrismaClient) { }

    async findByExternalRequestId(
        externalRequestId: string
    ): Promise<ProductManagerCommand | null> {
        return this.prisma.productManagerCommand.findUnique({
            where: { externalRequestId },
        });
    }

    async enqueue(input: EnqueueCommandInput): Promise<ProductManagerCommand> {
        return this.prisma.productManagerCommand.create({
            data: {
                externalRequestId: input.externalRequestId,
                productCode: input.productCode ?? "__NEW__",
                commandType: input.commandType as any,
                status: "PENDING",
                source: (input.source ?? "API2") as any,
                payload: input.payload ?? undefined,
            },
        });
    }

    async markProcessing(externalRequestId: string): Promise<void> {
        await this.prisma.productManagerCommand.update({
            where: { externalRequestId },
            data: {
                status: "PROCESSING",
                executedAt: new Date(),
            },
        });
    }

    async markConfirmed(externalRequestId: string): Promise<void> {
        await this.prisma.productManagerCommand.update({
            where: { externalRequestId },
            data: {
                status: "CONFIRMED",
                completedAt: new Date(),
            },
        });
    }

    async markFailed(
        externalRequestId: string,
        error: { code: string; message: string }
    ): Promise<void> {
        await this.prisma.productManagerCommand.update({
            where: { externalRequestId },
            data: {
                status: "FAILED",
                lastError: error as any,
                completedAt: new Date(),
            },
        });
    }

    async findPending(): Promise<ProductManagerCommand[]> {
        return this.prisma.productManagerCommand.findMany({
            where: { status: "PENDING" },
            orderBy: { createdAt: "asc" },
            take: 10,
        });
    }
}
