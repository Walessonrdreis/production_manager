type RawPayload = {
    bairro?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
    endereco?: string;
    enderecoNumero?: string;
    contato?: string;
};

function extractString(raw: unknown, key: string): string | null {
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
        const payload = raw as Record<string, unknown>;
        const value = payload[key];
        if (typeof value === "string" && value.trim().length > 0) {
            return value.trim();
        }
    }
    return null;
}

export type CustomerSummary = {
    customerCode: string;
    legalName: string;
    tradeName: string | null;
    document: string;
    personType: string;
    email: string | null;
    phone: string | null;
    isActive: boolean;
    isBlocked: boolean;
    city: string | null;
    state: string | null;
    lastSyncAt: Date;
};

export function mapOmieCustomerToSummary(record: {
    omieCode: string;
    legalName: string;
    tradeName: string | null;
    document: string;
    personType: string;
    email: string | null;
    phone: string | null;
    isActive: boolean;
    isBlocked: boolean;
    lastSyncAt: Date;
    rawPayload: unknown;
}): CustomerSummary {
    return {
        customerCode: record.omieCode,
        legalName: record.legalName,
        tradeName: record.tradeName || null,
        document: record.document,
        personType: record.personType,
        email: record.email || null,
        phone: record.phone || null,
        isActive: record.isActive,
        isBlocked: record.isBlocked,
        city: extractString(record.rawPayload, "cidade"),
        state: extractString(record.rawPayload, "estado"),
        lastSyncAt: record.lastSyncAt,
    };
}
