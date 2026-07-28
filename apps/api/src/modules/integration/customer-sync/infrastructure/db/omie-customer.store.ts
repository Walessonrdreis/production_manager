import { prisma } from "@/shared/db/prisma";
import { getLogger } from "@/shared/logger";

export type OmieCustomerRecord = {
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

export class OmieCustomerStore {
    private readonly logger = getLogger("OmieCustomerStore");

    async list(params: ListParams) {
        const {
            q = null,
            activeOnly = false,
            customerCodes = null,
            document = null,
            limit = 50,
            offset = 0,
            sort = "legalName",
            order = "asc",
            since = null,
            fields = null,
            includeRaw = false,
        } = params;

        const safeLimit = Math.max(1, Math.min(Number(limit || 50), 200));
        const safeOffset = Math.max(0, Number(offset || 0));

        const baseWhere = {
            ...(customerCodes && customerCodes.length > 0
                ? { omieCode: { in: customerCodes } }
                : {}),
            ...(document
                ? { document: { contains: document, mode: "insensitive" as const } }
                : {}),
            ...(q
                ? {
                    OR: [
                        { legalName: { contains: q, mode: "insensitive" as const } },
                        { tradeName: { contains: q, mode: "insensitive" as const } },
                        { document: { contains: q, mode: "insensitive" as const } },
                        { omieCode: { contains: q, mode: "insensitive" as const } },
                    ],
                }
                : {}),
            ...(since
                ? {
                    lastSyncAt: {
                        gte: new Date(since),
                    },
                }
                : {}),
        };

        const where = {
            ...baseWhere,
            ...(activeOnly ? { isActive: true } : {}),
        };

        const orderBy =
            sort === "customerCode"
                ? { omieCode: order }
                : sort === "document"
                    ? { document: order }
                    : sort === "lastSyncAt"
                        ? { lastSyncAt: order }
                        : { legalName: order };

        const [total, activeCount, inactiveCount, rows] = await Promise.all([
            prisma.omieCustomer.count({ where }),
            prisma.omieCustomer.count({
                where: {
                    ...baseWhere,
                    isActive: true,
                },
            }),
            prisma.omieCustomer.count({
                where: {
                    ...baseWhere,
                    isActive: false,
                },
            }),
            prisma.omieCustomer.findMany({
                where,
                orderBy,
                take: safeLimit,
                skip: safeOffset,
            }),
        ]);

        this.logger.info("List customer-sync", {
            total,
            activeCount,
            inactiveCount,
            limit: safeLimit,
            offset: safeOffset,
            q,
            activeOnly,
            customerCodes,
            document,
            sort,
            order,
            since,
        });

        return {
            summary: {
                total,
                active: activeCount,
                inactive: inactiveCount,
            },
            meta: {
                pageSize: safeLimit,
                pageCount: rows.length,
                offset: safeOffset,
            },
            data: rows.map((record) => {
                const base: OmieCustomerRecord = {
                    customerCode: record.omieCode,
                    omieCode: record.omieCode,
                    legalName: record.legalName,
                    tradeName: record.tradeName,
                    document: record.document,
                    personType: record.personType,
                    email: record.email,
                    phone: record.phone,
                    isActive: record.isActive,
                    isBlocked: record.isBlocked,
                    isBillingBlocked: record.isBillingBlocked,
                    createdAtOmie: record.createdAtOmie,
                    updatedAtOmie: record.updatedAtOmie,
                    lastSyncAt: record.lastSyncAt,
                };

                const full = includeRaw
                    ? { ...base, rawPayload: record.rawPayload }
                    : base;

                if (!fields || fields.length === 0) {
                    return full;
                }

                const filtered: Record<string, any> = {};
                for (const field of fields) {
                    if (field in full) {
                        filtered[field] = (full as any)[field];
                    }
                }

                return filtered;
            }),
        };
    }

    async findByCustomerCode(
        customerCode: string,
        options?: { includeRaw?: boolean }
    ) {
        const record = await prisma.omieCustomer.findUnique({
            where: { omieCode: customerCode },
        });

        if (!record) return null;

        const base: OmieCustomerRecord = {
            customerCode: record.omieCode,
            omieCode: record.omieCode,
            legalName: record.legalName,
            tradeName: record.tradeName,
            document: record.document,
            personType: record.personType,
            email: record.email,
            phone: record.phone,
            isActive: record.isActive,
            isBlocked: record.isBlocked,
            isBillingBlocked: record.isBillingBlocked,
            createdAtOmie: record.createdAtOmie,
            updatedAtOmie: record.updatedAtOmie,
            lastSyncAt: record.lastSyncAt,
        };

        return options?.includeRaw
            ? { ...base, rawPayload: record.rawPayload }
            : base;
    }

    async upsertFromExternal(input: {
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
    }) {
        return prisma.omieCustomer.upsert({
            where: { omieCode: input.customerCode },
            create: {
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
                rawPayload: input.rawPayload,
            },
            update: {
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
                rawPayload: input.rawPayload,
                lastSyncAt: new Date(),
            },
        });
    }

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
        this.logger.info("Batch upserting customers", { count: items.length });

        return prisma.$transaction(
            items.map((input) =>
                prisma.omieCustomer.upsert({
                    where: { omieCode: input.customerCode },
                    create: {
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
                        rawPayload: input.rawPayload,
                    },
                    update: {
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
                        rawPayload: input.rawPayload,
                        lastSyncAt: new Date(),
                    },
                }),
            ),
        );
    }

    async getStats() {
        const [total, active, inactive, lastCustomer] = await Promise.all([
            prisma.omieCustomer.count(),
            prisma.omieCustomer.count({ where: { isActive: true } }),
            prisma.omieCustomer.count({ where: { isActive: false } }),
            prisma.omieCustomer.findFirst({
                orderBy: { lastSyncAt: "desc" },
            }),
        ]);

        return {
            total,
            active,
            inactive,
            lastSyncAt: lastCustomer?.lastSyncAt ?? null,
            lastCustomerCode: lastCustomer?.omieCode ?? null,
        };
    }
}
