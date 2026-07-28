// ---------------------------------------------------------------------------
// Fake Store: FakeProductStockCommandStore
// Armazena comandos em memória (Map). Nunca toca no banco real.
// ---------------------------------------------------------------------------

import { getLogger } from "@/shared/logger";
import type { CreateAcceptedCommandInput } from "./product-stock-command.store";

type CommandRecord = {
    externalRequestId: string;
    productOmieId: string;
    commandType: string;
    status: string;
    source: string;
    createdAt: Date;
    completedAt: Date | null;
    lastError: unknown;
};

export class FakeProductStockCommandStore {
    private readonly logger = getLogger("FakeProductStockCommandStore");
    private readonly data: Map<string, CommandRecord>;

    constructor() {
        this.data = new Map();
        this.logger.info("FakeProductStockCommandStore initialized");
    }

    async findByExternalRequestId(externalRequestId: string) {
        return this.data.get(externalRequestId) ?? null;
    }

    async getOrCreateAccepted(input: CreateAcceptedCommandInput) {
        const existing = this.data.get(input.externalRequestId);
        if (existing) return { record: existing, created: false };

        const record: CommandRecord = {
            externalRequestId: input.externalRequestId,
            productOmieId: input.productOmieId,
            commandType: input.commandType,
            status: "ACCEPTED",
            source: input.source ?? "API2",
            createdAt: new Date(),
            completedAt: null,
            lastError: null,
        };

        this.data.set(input.externalRequestId, record);

        this.logger.info("Fake comando ACCEPTED (product-stock-fetch)", {
            externalRequestId: input.externalRequestId,
            productOmieId: input.productOmieId,
        });

        return { record, created: true };
    }

    async markConfirmed(externalRequestId: string) {
        const record = this.data.get(externalRequestId);
        if (!record) return null;
        record.status = "CONFIRMED";
        record.completedAt = new Date();
        return record;
    }

    async markFailed(externalRequestId: string, error: unknown) {
        const record = this.data.get(externalRequestId);
        if (!record) return null;
        record.status = "FAILED";
        record.completedAt = new Date();
        record.lastError =
            error instanceof Error
                ? { message: error.message, name: error.name }
                : { message: "Erro desconhecido" };
        return record;
    }

    async listRecent(limit = 20) {
        return Array.from(this.data.values())
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, limit);
    }

    async listFailures(limit = 20) {
        return Array.from(this.data.values())
            .filter((r) => r.status === "FAILED")
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, limit);
    }
}
