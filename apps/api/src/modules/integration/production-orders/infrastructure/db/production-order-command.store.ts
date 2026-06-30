// ---------------------------------------------------------------------------
// Command Store — Production Order
// ---------------------------------------------------------------------------
// Suporta Command Queue Pattern: PENDING → PROCESSING → CONFIRMED / FAILED
// Responsável exclusivamente por:
// - idempotência por externalRequestId
// - enfileiramento e dequeuing atômico (SKIP LOCKED)
// - tracking de status (PENDING | PROCESSING | CONFIRMED | FAILED)
// - auditoria mínima de comandos
// ---------------------------------------------------------------------------

import type { PrismaClient, ProductionOrderCommand } from "@prisma/client";
import { Prisma } from "@prisma/client";

export type CommandType = "SYNC_GLOBAL" | "CREATE_OP" | "UPDATE_OP" | "SYNC_OP" | "CANCEL_OP" | "CHANGE_STAGE" | "RECONCILE" | "INVALIDATE";
export type CommandStatus = "PENDING" | "PROCESSING" | "CONFIRMED" | "FAILED";
export type CommandSource = "API2" | "JOB" | "ADMIN";

export type EnqueueCommandInput = {
    externalRequestId: string;
    commandType: CommandType;
    payload?: Record<string, unknown>;
    source?: CommandSource;
};

export type CreateAcceptedCommandInput = {
    externalRequestId: string;
    commandType: CommandType;
    source?: CommandSource;
};

export type StatusCounts = {
    pending: number;
    processing: number;
    confirmed: number;
    failed: number;
};

export class ProductionOrderCommandStore {
    constructor(private readonly prisma: PrismaClient) { }

    // ─── Busca ───────────────────────────────────────────────────────────

    async findByExternalRequestId(
        externalRequestId: string
    ): Promise<ProductionOrderCommand | null> {
        return this.prisma.productionOrderCommand.findUnique({
            where: { externalRequestId },
        });
    }

    // ─── Enfileiramento ──────────────────────────────────────────────────

    /**
     * Cria um comando com status PENDING para processamento assíncrono.
     * Se já existir com o mesmo externalRequestId, retorna o existente.
     */
    async enqueue(
        input: EnqueueCommandInput
    ): Promise<{ record: ProductionOrderCommand; created: boolean }> {
        const existing = await this.findByExternalRequestId(input.externalRequestId);
        if (existing) {
            return { record: existing, created: false };
        }

        const record = await this.prisma.productionOrderCommand.create({
            data: {
                externalRequestId: input.externalRequestId,
                commandType: input.commandType,
                status: "PENDING",
                source: input.source ?? "API2",
                payload: input.payload
                    ? (input.payload as Prisma.InputJsonValue)
                    : Prisma.DbNull,
            },
        });

        return { record, created: true };
    }

    /**
     * Mantido para compatibilidade com módulos existentes.
     * Cria com status ACCEPTED (fluxo síncrono antigo).
     */
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

    // ─── Dequeuing (PENDING → PROCESSING) ────────────────────────────────

    /**
     * Dequeue atômico: pega N comandos PENDING e marca como PROCESSING.
     * Usa SELECT ... FOR UPDATE SKIP LOCKED para evitar concorrência
     * entre múltiplos workers/instâncias.
     */
    async dequeue(batchSize = 1): Promise<ProductionOrderCommand[]> {
        // 1) Seleciona IDs com lock (SKIP LOCKED evita deadlock entre workers)
        const rows: Array<{ id: string }> = await this.prisma.$queryRawUnsafe(
            `SELECT id FROM integration.production_order_command
             WHERE status = 'PENDING'
             ORDER BY created_at ASC
             LIMIT $1
             FOR UPDATE SKIP LOCKED`,
            batchSize
        );

        if (rows.length === 0) return [];

        const ids = rows.map((r) => r.id);

        // 2) Atualiza para PROCESSING
        await this.prisma.productionOrderCommand.updateMany({
            where: { id: { in: ids } },
            data: {
                status: "PROCESSING",
                executedAt: new Date(),
            },
        });

        // 3) Retorna os registros atualizados
        return this.prisma.productionOrderCommand.findMany({
            where: { id: { in: ids } },
            orderBy: { createdAt: "asc" },
        });
    }

    // ─── Transições de Status ────────────────────────────────────────────

    async markProcessing(
        externalRequestId: string
    ): Promise<ProductionOrderCommand> {
        return this.prisma.productionOrderCommand.update({
            where: { externalRequestId },
            data: {
                status: "PROCESSING",
                executedAt: new Date(),
            },
        });
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

    // ─── Consultas ───────────────────────────────────────────────────────

    async countByStatus(
        status: CommandStatus
    ): Promise<number> {
        return this.prisma.productionOrderCommand.count({
            where: { status },
        });
    }

    /**
     * Retorna contagem de todos os status em uma única chamada.
     */
    async countByStatusAll(): Promise<StatusCounts> {
        const rows = await this.prisma.$queryRawUnsafe<
            Array<{ status: string; count: bigint }>
        >(
            `SELECT status, COUNT(*)::int8 as count
             FROM integration.production_order_command
             GROUP BY status`
        );

        const result: StatusCounts = {
            pending: 0,
            processing: 0,
            confirmed: 0,
            failed: 0,
        };

        for (const row of rows) {
            const key = row.status.toLowerCase() as keyof StatusCounts;
            if (key in result) {
                result[key] = Number(row.count);
            }
        }

        return result;
    }

    /**
     * Lista os comandos mais recentes (qualquer status).
     */
    async listRecent(limit = 20): Promise<ProductionOrderCommand[]> {
        return this.prisma.productionOrderCommand.findMany({
            orderBy: { createdAt: "desc" },
            take: limit,
        });
    }

    /**
     * Lista os comandos com falha mais recentes.
     */
    async listFailures(limit = 20): Promise<ProductionOrderCommand[]> {
        return this.prisma.productionOrderCommand.findMany({
            where: { status: "FAILED" },
            orderBy: { createdAt: "desc" },
            take: limit,
        });
    }

    /**
     * Busca comandos PROCESSING mais antigos que N ms (stalled/orphaned).
     * Útil para recuperação de comandos que travaram.
     */
    async findProcessingStalled(
        ageMs: number
    ): Promise<ProductionOrderCommand[]> {
        const cutoff = new Date(Date.now() - ageMs);
        return this.prisma.productionOrderCommand.findMany({
            where: {
                status: "PROCESSING",
                executedAt: { lt: cutoff },
            },
            orderBy: { executedAt: "asc" },
        });
    }

    // ─── Retry (C1-P0) ──────────────────────────────────────────────────

    /**
     * Re-enfileira um comando FAILED de volta para PENDING,
     * incrementando retryCount e limpando lastError.
     */
    async resetToPending(
        externalRequestId: string
    ): Promise<ProductionOrderCommand> {
        return this.prisma.productionOrderCommand.update({
            where: { externalRequestId },
            data: {
                status: "PENDING",
                retryCount: { increment: 1 },
                lastError: Prisma.DbNull,
                completedAt: null,
                executedAt: null,
            },
        });
    }

    /**
     * Retorna a contagem atual de comandos FAILED.
     */
    async countFailed(): Promise<number> {
        return this.prisma.productionOrderCommand.count({
            where: { status: "FAILED" },
        });
    }
}
