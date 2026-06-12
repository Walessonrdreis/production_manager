import { prisma } from "@/shared/db/prisma";
import { getLogger } from "@/shared/logger";

export class ProductCatalogIntegrationStore {
  private readonly logger = getLogger("ProductCatalogIntegrationStore");

  // ✅ MÉTODO NOVO (CRÍTICO)
  async upsertFromExternal(input: {
    productCode: string;
    omieId?: string | null;
    sku?: string | null;
    description: string;
    familyDescription?: string | null;
    active: boolean;
    rawPayload: any;
  }) {
    await prisma.omieProduct.upsert({
      where: { omieCode: input.productCode },
      create: {
        omieCode: input.productCode,
        omieId: input.omieId ?? null,
        sku: input.sku ?? null,
        description: input.description,
        familyDescription: input.familyDescription ?? null,
        active: input.active,
        rawPayload: input.rawPayload,
        lastSyncAt: new Date(),
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
// ✅ Lista catálogo (read-model)
async list(params: {
  q?: string | null;
  activeOnly?: boolean;
  limit?: number;
  offset?: number;
}) {
  const {
    q = null,
    activeOnly = false,
    limit = 50,
    offset = 0,
  } = params;

  const where = {
    ...(activeOnly ? { active: true } : {}),
    ...(q
      ? {
          OR: [
            { description: { contains: q, mode: "insensitive" as const } },
            { omieCode: { contains: q, mode: "insensitive" as const } },
            { sku: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.omieProduct.count({ where }),
    prisma.omieProduct.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { description: "asc" },
    }),
  ]);

  return {
    summary: {
      total,
      active: await prisma.omieProduct.count({
        where: { ...where, active: true },
      }),
      inactive: await prisma.omieProduct.count({
        where: { ...where, active: false },
      }),
    },
    meta: {
      pageSize: limit,
      pageCount: rows.length,
      offset,
    },
    data: rows.map((record) => ({
      productCode: record.omieCode,
      omieId: record.omieId ?? null,
      sku: record.sku || null,
      description: record.description,
      familyDescription: record.familyDescription || null,
      active: record.active,
      lastSyncAt: record.lastSyncAt,
    })),
  };
}

  // ✅ Busca produto por código (read-model por ID)
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
    ? {
        ...base,
        rawPayload: record.rawPayload,
      }
    : base;
  }

} 
