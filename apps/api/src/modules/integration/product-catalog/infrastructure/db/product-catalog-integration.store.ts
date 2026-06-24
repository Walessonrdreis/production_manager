import { prisma } from "@/shared/db/prisma";
import { getLogger } from "@/shared/logger";

type ListParams = {
  q?: string | null;
  activeOnly?: boolean;
  productCodes?: string[] | null;
  sku?: string | null;
  limit?: number;
  offset?: number;
  sort?: "description" | "productCode" | "lastSyncAt";
  order?: "asc" | "desc";
  since?: string | null;
  fields?: string[] | null;
  includeRaw?: boolean;
};

export class ProductCatalogIntegrationStore {
  private readonly logger = getLogger("ProductCatalogIntegrationStore");

  async list(params: ListParams) {
    const {
      q = null,
      activeOnly = false,
      productCodes = null,
      sku = null,
      limit = 50,
      offset = 0,
      sort = "description",
      order = "asc",
      since = null,
      fields = null,
      includeRaw = false,
    } = params;

    const safeLimit = Math.max(1, Math.min(Number(limit || 50), 200));
    const safeOffset = Math.max(0, Number(offset || 0));

    const baseWhere = {
      ...(productCodes && productCodes.length > 0
        ? { omieCode: { in: productCodes } }
        : {}),
      ...(sku ? { sku: { contains: sku, mode: "insensitive" as const } } : {}),
      ...(q
        ? {
          OR: [
            { description: { contains: q, mode: "insensitive" as const } },
            { sku: { contains: q, mode: "insensitive" as const } },
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
      ...(activeOnly ? { active: true } : {}),
    };

    const orderBy =
      sort === "productCode"
        ? { omieCode: order }
        : sort === "lastSyncAt"
          ? { lastSyncAt: order }
          : { description: order };

    const [total, activeCount, inactiveCount, rows] = await Promise.all([
      prisma.omieProduct.count({ where }),
      prisma.omieProduct.count({
        where: {
          ...baseWhere,
          active: true,
        },
      }),
      prisma.omieProduct.count({
        where: {
          ...baseWhere,
          active: false,
        },
      }),
      prisma.omieProduct.findMany({
        where,
        orderBy,
        take: safeLimit,
        skip: safeOffset,
      }),
    ]);

    this.logger.info("List product-catalog", {
      total,
      activeCount,
      inactiveCount,
      limit: safeLimit,
      offset: safeOffset,
      q,
      activeOnly,
      productCodes,
      sku,
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
        const base = {
          productCode: record.omieCode,
          omieId: record.omieId ?? null,
          sku: record.sku || null,
          description: record.description,
          familyDescription: record.familyDescription || null,
          active: record.active,
          lastSyncAt: record.lastSyncAt,
        };

        const full = includeRaw
          ? {
            ...base,
            rawPayload: record.rawPayload,
          }
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

  async findByProductCode(
    productCode: string,
    options?: { includeRaw?: boolean }
  ) {
    const record = await prisma.omieProduct.findUnique({
      where: { omieCode: productCode },
    });

    if (!record) return null;

    const base = {
      productCode: record.omieCode,
      omieId: record.omieId ?? null,
      sku: record.sku || null,
      description: record.description,
      familyDescription: record.familyDescription || null,
      active: record.active,
      lastSyncAt: record.lastSyncAt,
    };

    return options?.includeRaw
      ? { ...base, rawPayload: record.rawPayload }
      : base;
  }

  async upsertFromExternal(input: {
    productCode: string;
    omieId?: string | null;
    sku?: string | null;
    description: string;
    familyDescription?: string | null;
    active: boolean;
    rawPayload: any;
  }) {
    return prisma.omieProduct.upsert({
      where: { omieCode: input.productCode },
      create: {
        omieCode: input.productCode,
        omieId: input.omieId ?? null,
        sku: input.sku ?? null,
        description: input.description,
        familyDescription: input.familyDescription ?? null,
        active: input.active,
        rawPayload: input.rawPayload,
      },
      update: {
        omieId: input.omieId ?? null,
        sku: input.sku ?? null,
        description: input.description,
        familyDescription: input.familyDescription ?? null,
        active: input.active,
        rawPayload: input.rawPayload,
        lastSyncAt: new Date(),
      },
    });
  }

  async saveMany(
    items: Array<{
      productCode: string;
      omieId?: string | null;
      sku?: string | null;
      description: string;
      familyDescription?: string | null;
      active: boolean;
      rawPayload: any;
    }>,
  ) {
    this.logger.info("Batch upserting products", { count: items.length });

    return prisma.$transaction(
      items.map((input) =>
        prisma.omieProduct.upsert({
          where: { omieCode: input.productCode },
          create: {
            omieCode: input.productCode,
            omieId: input.omieId ?? null,
            sku: input.sku ?? null,
            description: input.description,
            familyDescription: input.familyDescription ?? null,
            active: input.active,
            rawPayload: input.rawPayload,
          },
          update: {
            omieId: input.omieId ?? null,
            sku: input.sku ?? null,
            description: input.description,
            familyDescription: input.familyDescription ?? null,
            active: input.active,
            rawPayload: input.rawPayload,
            lastSyncAt: new Date(),
          },
        }),
      ),
    );
  }

  async getStats() {
    const [total, active, inactive, lastProduct] = await Promise.all([
      prisma.omieProduct.count(),
      prisma.omieProduct.count({ where: { active: true } }),
      prisma.omieProduct.count({ where: { active: false } }),
      prisma.omieProduct.findFirst({
        orderBy: { lastSyncAt: "desc" },
      }),
    ]);

    return {
      total,
      active,
      inactive,
      lastSyncAt: lastProduct?.lastSyncAt ?? null,
      lastProductCode: lastProduct?.omieCode ?? null,
    };
  }
}