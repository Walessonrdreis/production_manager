import { prisma } from "@/shared/db/prisma";

export type SalesOrderStageTransitionRecord = {
    id: string;
    salesOrderOmieId: string;
    fromStage: string | null;
    toStage: string;
    detectedAt: Date;
    createdAt: Date;
};

export type CreateStageTransitionInput = {
    salesOrderOmieId: string;
    fromStage: string | null;
    toStage: string;
};

export class SalesOrderStageTransitionStore {
    /**
     * Carrega o mapa atual de omieId → stage do read-model.
     * Usado para detectar mudanças de etapa durante o refresh.
     */
    async getCurrentStagesMap(): Promise<Map<string, string>> {
        const summaries = await prisma.salesOrderSummaryReadModel.findMany({
            select: { omieId: true, stage: true },
        });

        const map = new Map<string, string>();
        for (const s of summaries) {
            map.set(s.omieId, s.stage);
        }
        return map;
    }

    /**
     * Cria registros de transição de etapa em lote.
     * skipDuplicates evita inserir a mesma transição duas vezes.
     */
    async createTransitions(
        inputs: CreateStageTransitionInput[]
    ): Promise<number> {
        if (inputs.length === 0) return 0;

        const { count } = await prisma.salesOrderStageTransition.createMany({
            data: inputs.map((input) => ({
                salesOrderOmieId: input.salesOrderOmieId,
                fromStage: input.fromStage,
                toStage: input.toStage,
            })),
            skipDuplicates: true,
        });

        return count;
    }

    /**
     * Lista o histórico de transições de um pedido específico.
     */
    async listByOrder(omieId: string) {
        return prisma.salesOrderStageTransition.findMany({
            where: { salesOrderOmieId: omieId },
            orderBy: { detectedAt: "asc" },
        });
    }

    /**
     * Lista todas as transições com paginação e filtros opcionais.
     */
    async list(params: {
        limit?: number;
        offset?: number;
        salesOrderOmieId?: string;
        toStage?: string;
    } = {}) {
        const { limit = 100, offset = 0, salesOrderOmieId, toStage } = params;

        const safeLimit = Math.max(1, Math.min(Number(limit || 100), 500));
        const safeOffset = Math.max(0, Number(offset || 0));

        const where: Record<string, unknown> = {};

        if (salesOrderOmieId) {
            where.salesOrderOmieId = salesOrderOmieId;
        }

        if (toStage) {
            where.toStage = toStage;
        }

        const [total, rows] = await Promise.all([
            prisma.salesOrderStageTransition.count({ where: where as any }),
            prisma.salesOrderStageTransition.findMany({
                where: where as any,
                orderBy: { detectedAt: "desc" },
                take: safeLimit,
                skip: safeOffset,
            }),
        ]);

        return {
            meta: {
                total,
                pageSize: safeLimit,
                pageCount: rows.length,
                offset: safeOffset,
            },
            data: rows,
        };
    }
}
