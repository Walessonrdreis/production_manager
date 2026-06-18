import { prisma } from "@/shared/db/prisma";
import { getLogger } from "@/shared/logger";

export type CreateAcceptedCustomerCommandInput = {
    externalRequestId: string;
    customerCode: string;
    commandType: "SYNC";
    source?: "API2" | "JOB" | "ADMIN";
};

export class CustomerCommandStore {
    private readonly logger = getLogger("CustomerCommandStore");

    async findByExternalRequestId(externalRequestId: string) {
        return prisma.customerCommand.findUnique({
            where: { externalRequestId },
        });
    }

    async getOrCreateAccepted(input: CreateAcceptedCustomerCommandInput) {
        const existing = await this.findByExternalRequestId(input.externalRequestId);
        if (existing) return { record: existing, created: false };

        this.logger.info("Criando comando ACEITO (customer-sync)", {
            externalRequestId: input.externalRequestId,
            customerCode: input.customerCode,
            commandType: input.commandType,
            source: input.source ?? "API2",
        });

        const record = await prisma.customerCommand.create({
            data: {
                externalRequestId: input.externalRequestId,
                customerCode: input.customerCode,
                commandType: input.commandType,
                status: "ACCEPTED",
                source: input.source ?? "API2",
            },
        });

        return { record, created: true };
    }

    async markConfirmed(externalRequestId: string) {
        return prisma.customerCommand.update({
            where: { externalRequestId },
            data: {
                status: "CONFIRMED",
                completedAt: new Date(),
            },
        });
    }

    async markFailed(externalRequestId: string, error: unknown) {
        return prisma.customerCommand.update({
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
        return prisma.customerCommand.findMany({
            orderBy: { createdAt: "desc" },
            take: limit,
        });
    }

    async listFailures(limit = 20) {
        return prisma.customerCommand.findMany({
            where: { status: "FAILED" },
            orderBy: { createdAt: "desc" },
            take: limit,
        });
    }
}
