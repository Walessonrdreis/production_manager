import { getLogger } from "@/shared/logger";

// ---------------------------------------------------------------------------
// Tipos (duplicados localmente para evitar dependência cíclica)
// ---------------------------------------------------------------------------
type OmieCustomerRecord = {
    customerCode: string;
    omieCode: string;
    legalName: string;
    tradeName: string | null;
    document: string;
    personType: string;
    email: string | null;
    phone: string | null;
    isActive: boolean;
    isBlocked: boolean;
    isBillingBlocked: boolean;
    createdAtOmie: Date | null;
    updatedAtOmie: Date | null;
    lastSyncAt: Date;
};

type ListParams = {
    q?: string | null;
    activeOnly?: boolean;
    customerCodes?: string[] | null;
    document?: string | null;
    limit?: number;
    offset?: number;
    sort?: "legalName" | "customerCode" | "document" | "lastSyncAt";
    order?: "asc" | "desc";
    since?: string | null;
    fields?: string[] | null;
    includeRaw?: boolean;
};

type UpsertInput = {
    customerCode: string;
    legalName: string;
    tradeName?: string | null;
    document: string;
    personType: string;
    email?: string | null;
    phone?: string | null;
    isActive: boolean;
    isBlocked: boolean;
    isBillingBlocked: boolean;
    createdAtOmie?: Date | null;
    updatedAtOmie?: Date | null;
    rawPayload: any;
};

// ---------------------------------------------------------------------------
// Dados mockados (5 clientes)
// ---------------------------------------------------------------------------
const FAKE_DATA: OmieCustomerRecord[] = [
    {
        customerCode: "0001",
        omieCode: "0001",
        legalName: "João Silva",
        tradeName: "João Silva ME",
        document: "12345678900123",
        personType: "F",
        email: "joao@email.com",
        phone: "11999990001",
        isActive: true,
        isBlocked: false,
        isBillingBlocked: false,
        createdAtOmie: new Date("2024-01-01"),
        updatedAtOmie: new Date("2024-06-01"),
        lastSyncAt: new Date(),
    },
    {
        customerCode: "0002",
        omieCode: "0002",
        legalName: "Maria Oliveira Ltda",
        tradeName: "Maria Oliveira",
        document: "98765432100123",
        personType: "J",
        email: "maria@empresa.com",
        phone: "11999990002",
        isActive: true,
        isBlocked: false,
        isBillingBlocked: false,
        createdAtOmie: new Date("2024-02-15"),
        updatedAtOmie: new Date("2024-06-10"),
        lastSyncAt: new Date(),
    },
    {
        customerCode: "0003",
        omieCode: "0003",
        legalName: "Carlos Pereira",
        tradeName: null,
        document: "11122233344",
        personType: "F",
        email: null,
        phone: "11999990003",
        isActive: false,
        isBlocked: true,
        isBillingBlocked: false,
        createdAtOmie: new Date("2023-11-20"),
        updatedAtOmie: new Date("2024-03-01"),
        lastSyncAt: new Date(),
    },
    {
        customerCode: "0004",
        omieCode: "0004",
        legalName: "Tech Solutions S.A.",
        tradeName: "Tech Solutions",
        document: "55443322100123",
        personType: "J",
        email: "contato@techsol.com",
        phone: "11999990004",
        isActive: true,
        isBlocked: false,
        isBillingBlocked: false,
        createdAtOmie: new Date("2024-03-01"),
        updatedAtOmie: new Date("2024-05-15"),
        lastSyncAt: new Date(),
    },
    {
        customerCode: "0005",
        omieCode: "0005",
        legalName: "Ana Beatriz Costa",
        tradeName: "Ana Costa",
        document: "99887766554",
        personType: "F",
        email: "ana@costa.com",
        phone: "11999990005",
        isActive: true,
        isBlocked: false,
        isBillingBlocked: false,
        createdAtOmie: new Date("2024-04-10"),
        updatedAtOmie: new Date("2024-06-18"),
        lastSyncAt: new Date(),
    },
];

// ---------------------------------------------------------------------------
// FakeOmieCustomerStore
// ---------------------------------------------------------------------------
export class FakeOmieCustomerStore {
    private readonly logger = getLogger("FakeOmieCustomerStore");
    private readonly data: Map<string, OmieCustomerRecord>;

    constructor() {
        this.data = new Map();
        for (const item of FAKE_DATA) {
            this.data.set(item.customerCode, { ...item });
        }
        this.logger.info("FakeOmieCustomerStore initialized", {
            count: this.data.size,
        });
    }

    // ---- list ----
    async list(params: ListParams = {}) {
        const {
            q = null,
            activeOnly = false,
            customerCodes = null,
            document = null,
            limit = 50,
            offset = 0,
            sort = "legalName",
            order = "asc",
        } = params;

        let rows = Array.from(this.data.values());

        // Filtro por código
        if (customerCodes && customerCodes.length > 0) {
            rows = rows.filter((r) => customerCodes.includes(r.customerCode));
        }

        // Filtro por documento
        if (document) {
            const docLower = document.toLowerCase();
            rows = rows.filter((r) => r.document.toLowerCase().includes(docLower));
        }

        // Filtro textual
        if (q) {
            const ql = q.toLowerCase();
            rows = rows.filter(
                (r) =>
                    r.legalName.toLowerCase().includes(ql) ||
                    (r.tradeName && r.tradeName.toLowerCase().includes(ql)) ||
                    r.document.includes(q) ||
                    r.customerCode.includes(q),
            );
        }

        // Filtro ativos
        if (activeOnly) {
            rows = rows.filter((r) => r.isActive);
        }

        const total = rows.length;
        const activeCount = rows.filter((r) => r.isActive).length;
        const inactiveCount = rows.filter((r) => !r.isActive).length;

        // Ordenação
        rows.sort((a, b) => {
            const aVal = String(a[sort as keyof OmieCustomerRecord] ?? "");
            const bVal = String(b[sort as keyof OmieCustomerRecord] ?? "");
            return order === "desc"
                ? bVal.localeCompare(aVal, "pt-BR")
                : aVal.localeCompare(bVal, "pt-BR");
        });

        // Paginação
        const safeLimit = Math.max(1, Math.min(limit, 200));
        const safeOffset = Math.max(0, offset);
        const page = rows.slice(safeOffset, safeOffset + safeLimit);

        return {
            summary: { total, active: activeCount, inactive: inactiveCount },
            meta: { pageSize: safeLimit, pageCount: page.length, offset: safeOffset },
            data: page,
        };
    }

    // ---- findByCustomerCode ----
    async findByCustomerCode(
        customerCode: string,
        _options?: { includeRaw?: boolean },
    ) {
        return this.data.get(customerCode) ?? null;
    }

    // ---- upsertFromExternal ----
    async upsertFromExternal(input: UpsertInput) {
        const existing = this.data.get(input.customerCode);

        const record: OmieCustomerRecord = {
            customerCode: input.customerCode,
            omieCode: input.customerCode,
            legalName: input.legalName,
            tradeName: input.tradeName ?? null,
            document: input.document,
            personType: input.personType,
            email: input.email ?? null,
            phone: input.phone ?? null,
            isActive: input.isActive,
            isBlocked: input.isBlocked,
            isBillingBlocked: input.isBillingBlocked,
            createdAtOmie: input.createdAtOmie ?? null,
            updatedAtOmie: input.updatedAtOmie ?? null,
            lastSyncAt: new Date(),
        };

        this.data.set(input.customerCode, record);

        this.logger.info("Fake upserted customer", {
            customerCode: input.customerCode,
            created: !existing,
        });

        return record;
    }

    // ---- saveMany ----
    async saveMany(
        items: Array<{
            customerCode: string;
            legalName: string;
            tradeName: string | null;
            document: string;
            personType: string;
            email: string | null;
            phone: string | null;
            isActive: boolean;
            isBlocked: boolean;
            isBillingBlocked: boolean;
            createdAtOmie: Date | null | undefined;
            updatedAtOmie: Date | null | undefined;
            rawPayload: any;
        }>,
    ) {
        const records = items.map((input) => {
            const record: OmieCustomerRecord = {
                customerCode: input.customerCode,
                omieCode: input.customerCode,
                legalName: input.legalName,
                tradeName: input.tradeName ?? null,
                document: input.document,
                personType: input.personType,
                email: input.email ?? null,
                phone: input.phone ?? null,
                isActive: input.isActive,
                isBlocked: input.isBlocked,
                isBillingBlocked: input.isBillingBlocked,
                createdAtOmie: input.createdAtOmie ?? null,
                updatedAtOmie: input.updatedAtOmie ?? null,
                lastSyncAt: new Date(),
            };
            this.data.set(input.customerCode, record);
            return record;
        });

        this.logger.info("Fake batch upserted customers", { count: records.length });
        return records;
    }

    // ---- getStats ----
    async getStats() {
        const all = Array.from(this.data.values());
        const total = all.length;
        const active = all.filter((r) => r.isActive).length;
        const inactive = total - active;

        const lastCustomer = all.sort(
            (a, b) => b.lastSyncAt.getTime() - a.lastSyncAt.getTime(),
        )[0];

        return {
            total,
            active,
            inactive,
            lastSyncAt: lastCustomer?.lastSyncAt ?? null,
            lastCustomerCode: lastCustomer?.customerCode ?? null,
        };
    }
}
