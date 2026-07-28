// ---------------------------------------------------------------------------
// Store: ProductStockCommandStore
// Gerencia idempotência e tracking de comandos de refresh de estoque.
// ---------------------------------------------------------------------------

import { prisma } from "@/shared/db/prisma";
import { getLogger } from "@/shared/logger";

export type CreateAcceptedCommandInput = {
    externalRequestId: string;
    productOmieId: string;
    commandType: "REFRESH_STOCK";
    source?: "API2" | "JOB" | "ADMIN";
};

export class ProductStockCommandStore {
    private readonly logger = getLogger("ProductStockCommandStore");

    async findByExternalRequestId(externalRequestId: string) {
        return prisma.productStockCommand.findUnique({
            where: { externalRequestId },
        });
    }

    async getOrCreateAccepted(input: CreateAcceptedCommandInput) {
        const existing = await this.findByExternalRequestId(input.externalRequestId);
        if (existing) return { record: existing, created: false };

        this.logger.info("Criando comando ACEITO (product-stock-fetch)", {
            externalRequestId: input.externalRequestId,
            productOmieId: input.productOmieId,
            commandType: input.commandType,
            source: input.source ?? "API2",
        });

        const record = await prisma.productStockCommand.create({
            data: {
                externalRequestId: input.externalRequestId,
                productOmieId: input.productOmieId,
                commandType: input.commandType,
                status: "ACCEPTED",
                source: input.source ?? "API2",
            },
        });

        return { record, created: true };
    }

    async markConfirmed(externalRequestId: string) {
        return prisma.productStockCommand.update({
            where: { externalRequestId },
            data: {
                status: "CONFIRMED",
                completedAt: new Date(),
            },
        });
    }

    async markFailed(externalRequestId: string, error: unknown) {
        return prisma.productStockCommand.update({
            where: { externalRequestId },
            data: {
                status: "FAILED",
                completedAt: new Date(),
                lastError:
                    error instanceof Error
                        ? { message: error.message, name: error.name }
                        : { message: "Erro desconhecido" },
            },
        });
    }

    async listRecent(limit = 20) {
        return prisma.productStockCommand.findMany({
            orderBy: { createdAt: "desc" },
            take: limit,
        });
    }

    async listFailures(limit = 20) {
        return prisma.productStockCommand.findMany({
            where: { status: "FAILED" },
            orderBy: { createdAt: "desc" },
            take: limit,
        });
    }
}
