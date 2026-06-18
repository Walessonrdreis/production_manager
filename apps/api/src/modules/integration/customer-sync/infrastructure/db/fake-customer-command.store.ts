import { getLogger } from "@/shared/logger";
import type { CreateAcceptedCustomerCommandInput } from "./customer-command.store";

// ---------------------------------------------------------------------------
// Tipos internos
// ---------------------------------------------------------------------------
type CommandRecord = {
    externalRequestId: string;
    customerCode: string;
    commandType: string;
    status: string;
    source: string;
    createdAt: Date;
    completedAt: Date | null;
    lastError: unknown;
};

// ---------------------------------------------------------------------------
// FakeCustomerCommandStore
// Armazena comandos em memória (Map). Nunca toca no banco real.
// ---------------------------------------------------------------------------
export class FakeCustomerCommandStore {
    private readonly logger = getLogger("FakeCustomerCommandStore");
    private readonly data: Map<string, CommandRecord>;

    constructor() {
        this.data = new Map();
        this.logger.info("FakeCustomerCommandStore initialized");
    }

    // ---- findByExternalRequestId ----
    async findByExternalRequestId(externalRequestId: string) {
        return this.data.get(externalRequestId) ?? null;
    }

    // ---- getOrCreateAccepted ----
    async getOrCreateAccepted(input: CreateAcceptedCustomerCommandInput) {
        const existing = this.data.get(input.externalRequestId);
        if (existing) return { record: existing, created: false };

        const record: CommandRecord = {
            externalRequestId: input.externalRequestId,
            customerCode: input.customerCode,
            commandType: input.commandType,
            status: "ACCEPTED",
            source: input.source ?? "API2",
            createdAt: new Date(),
            completedAt: null,
            lastError: null,
        };

        this.data.set(input.externalRequestId, record);

        this.logger.info("Fake comando ACCEPTED", {
            externalRequestId: input.externalRequestId,
            customerCode: input.customerCode,
        });

        return { record, created: true };
    }

    // ---- markConfirmed ----
    async markConfirmed(externalRequestId: string) {
        const record = this.data.get(externalRequestId);
        if (!record) return null;

        record.status = "CONFIRMED";
        record.completedAt = new Date();
        return record;
    }

    // ---- markFailed ----
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

    // ---- listRecent ----
    async listRecent(limit = 20) {
        return Array.from(this.data.values())
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, limit);
    }

    // ---- listFailures ----
    async listFailures(limit = 20) {
        return Array.from(this.data.values())
            .filter((r) => r.status === "FAILED")
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, limit);
    }
}
