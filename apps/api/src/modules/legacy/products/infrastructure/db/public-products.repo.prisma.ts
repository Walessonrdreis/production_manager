// src/modules/products/infrastructure/db/public-products.repo.prisma.ts

import type { PublicProduct } from "@/modules/legacy/products/application/dtos/public-product.dto";

type PublicProductRow = {
  omieCode: string;
  description: string;
  sku: string | null;
  family: string | null;
  active: boolean;
  stockQuantity: string | null;
  minimumStock: string | null;
  stockUpdatedAt: Date | null;
};

export function createPublicProductsRepoPrisma(prisma: any) {
  return {
    async list(params: {
      normalizedQ: string | null;
      activeOnly: boolean;
      page: number;
      pageSize: number;
      offset: number;
    }): Promise<{ rows: PublicProductRow[]; total: number }> {
      const { normalizedQ, activeOnly, pageSize, offset } = params;

      const rows = await prisma.$queryRaw<PublicProductRow[]>`
        WITH latest_stock AS (
          SELECT DISTINCT ON ("omieCode")
            "omieCode",
            "stockQuantity",
            "minimumStock",
            "capturedAt"
          FROM "product_stock"
          ORDER BY "omieCode", "capturedAt" DESC
        )
        SELECT
          o."omieCode" AS "omieCode",
          o."description" AS "description",
          o."sku" AS "sku",
          o."familyDescription" AS "family",
          o."active" AS "active",
          COALESCE(to_char(latest_stock."stockQuantity", 'FM999999999999990.0000'), '0.0000') AS "stockQuantity",
          COALESCE(to_char(latest_stock."minimumStock", 'FM999999999999990.0000'), '0.0000') AS "minimumStock",
          latest_stock."capturedAt" AS "stockUpdatedAt"
        FROM "OmieProduct" o
        LEFT JOIN latest_stock
          ON latest_stock."omieCode" = o."omieCode"
        WHERE
          (${activeOnly}::boolean = false OR o."active" = true)
          AND (
            ${normalizedQ}::text IS NULL
            OR o."description" ILIKE ('%' || ${normalizedQ}::text || '%')
            OR COALESCE(o."sku", '') ILIKE ('%' || ${normalizedQ}::text || '%')
            OR o."omieCode" ILIKE ('%' || ${normalizedQ}::text || '%')
          )
        ORDER BY o."description" ASC
        LIMIT ${pageSize}
        OFFSET ${offset}
      `;

      const totalRows = await prisma.$queryRaw<Array<{ total: bigint | number }>>`
        SELECT COUNT(*) AS "total"
        FROM "OmieProduct" o
        WHERE
          (${activeOnly}::boolean = false OR o."active" = true)
          AND (
            ${normalizedQ}::text IS NULL
            OR o."description" ILIKE ('%' || ${normalizedQ}::text || '%')
            OR COALESCE(o."sku", '') ILIKE ('%' || ${normalizedQ}::text || '%')
            OR o."omieCode" ILIKE ('%' || ${normalizedQ}::text || '%')
          )
      `;

      const totalRaw = totalRows?.[0]?.total ?? 0;
      const total = typeof totalRaw === "bigint" ? Number(totalRaw) : Number(totalRaw ?? 0);

      return { rows, total };
    },

    async getByOmieCode(normalizedCode: string): Promise<PublicProductRow | null> {
      const rows = await prisma.$queryRaw<PublicProductRow[]>`
        WITH latest_stock AS (
          SELECT DISTINCT ON ("omieCode")
            "omieCode",
            "stockQuantity",
            "minimumStock",
            "capturedAt"
          FROM "product_stock"
          ORDER BY "omieCode", "capturedAt" DESC
        )
        SELECT
          o."omieCode" AS "omieCode",
          o."description" AS "description",
          o."sku" AS "sku",
          o."familyDescription" AS "family",
          o."active" AS "active",
          COALESCE(to_char(latest_stock."stockQuantity", 'FM999999999999990.0000'), '0.0000') AS "stockQuantity",
          COALESCE(to_char(latest_stock."minimumStock", 'FM999999999999990.0000'), '0.0000') AS "minimumStock",
          latest_stock."capturedAt" AS "stockUpdatedAt"
        FROM "OmieProduct" o
        LEFT JOIN latest_stock
          ON latest_stock."omieCode" = o."omieCode"
        WHERE o."omieCode" = ${normalizedCode}::text
        LIMIT 1
      `;

      return rows?.[0] ?? null;
    },

    toPublicProduct(row: PublicProductRow): PublicProduct {
      return {
        omieCode: row.omieCode,
        description: row.description,
        sku: row.sku,
        family: row.family,
        active: row.active,
        stockQuantity: row.stockQuantity ?? "0.0000",
        minimumStock: row.minimumStock ?? "0.0000",
        stockUpdatedAt: row.stockUpdatedAt ? row.stockUpdatedAt.toISOString() : null,
      };
    },
  };
}