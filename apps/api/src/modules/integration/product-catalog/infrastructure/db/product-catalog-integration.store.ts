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

    const where = {
      ...(activeOnly ? { active: true } : {}),
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

    const orderBy =
      sort === "productCode"
        ? { omieCode: order }
        : sort === "lastSyncAt"
        ? { lastSyncAt: order }
        : { description: order };

    const [total, rows] = await Promise.all([
      prisma.omieProduct.count({ where }),
      prisma.omieProduct.findMany({
        where,
        orderBy,
        take: safeLimit,
        skip: safeOffset,
      }),
    ]);

    this.logger.info("List product-catalog", {
      total,
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
        active: rows.filter((r) => r.active).length,
        inactive: rows.filter((r) => !r.active).length,
      },
      data: rows.map((record) => {
        const base = {
          productCode: record.omieCode,
          omieId: record.omieId ?? null,
          sku: record.sku ?? null,
          description: record.description,
          familyDescription: record.familyDescription ?? null,
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
      sku: record.sku ?? null,
      description: record.description,
      familyDescription: record.familyDescription ?? null,
      active: record.active,
      lastSyncAt: record.lastSyncAt,
    };

    return options?.includeRaw
      ? { ...base, rawPayload: record.rawPayload }
      : base;
  }
}