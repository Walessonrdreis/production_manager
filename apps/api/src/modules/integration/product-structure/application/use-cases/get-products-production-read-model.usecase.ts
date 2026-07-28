// apps/api/src/modules/integration/product-structure/application/use-cases/get-products-production-read-model.usecase.ts

import { prisma } from "@/shared/db/prisma";
import { Prisma } from "@prisma/client";

export type GetProductsProductionReadModelParams = {
  view?: "summary" | "data";

  q?: string | null;
  activeOnly?: boolean;
  onlyWithoutStructure?: boolean;
  structureStatus?: "with" | "without";

  limit?: number;
  offset?: number;

  sort?: "description" | "productCode" | "hasStructure";
  order?: "asc" | "desc";

  since?: string | null;
  includeItems?: boolean;
};

type DataRow = {
  productCode: string;
  description: string;
  hasStructure: boolean;
  canCreateProductionOrder: boolean;
};

type SummaryRow = {
  total: bigint | number;
  withStructure: bigint | number;
  withoutStructure: bigint | number;
};

export class GetProductsProductionReadModelUseCase {
  async execute(params: GetProductsProductionReadModelParams = {}) {
    const {
      view,
      q = null,
      activeOnly = true,
      onlyWithoutStructure = false,
      structureStatus,

      limit = 50,
      offset = 0,

      sort = "description",
      order = "asc",

      since = null,
    } = params;

    const safeLimit = Math.min(Math.max(limit, 1), 200);
    const safeOffset = Math.max(offset, 0);

    const orderSql = order === "desc" ? Prisma.sql`DESC` : Prisma.sql`ASC`;

    const sortSql =
      sort === "productCode"
        ? Prisma.sql`p.omie_code`
        : sort === "hasStructure"
          ? Prisma.sql`has_structure`
          : Prisma.sql`p.description`;

    const existsStructure = Prisma.sql`
      EXISTS (
        SELECT 1
        FROM "integration"."product_structure" ps
        WHERE ps.cod_produto = p.omie_code
          AND ps.has_structure = true
      )
    `;

    const whereParts: Prisma.Sql[] = [];

    if (activeOnly) {
      whereParts.push(Prisma.sql`AND p.active = true`);
    }

    if (q && q.trim()) {
      whereParts.push(
        Prisma.sql`
          AND (
            p.description ILIKE ('%' || ${q} || '%')
            OR p.omie_code ILIKE ('%' || ${q} || '%')
          )
        `
      );
    }

    if (onlyWithoutStructure || structureStatus === "without") {
      whereParts.push(Prisma.sql`AND NOT (${existsStructure})`);
    }

    if (structureStatus === "with") {
      whereParts.push(Prisma.sql`AND (${existsStructure})`);
    }

    if (since) {
      whereParts.push(
        Prisma.sql`AND p.updated_at >= ${since}::timestamptz`
      );
    }

    const whereSql = Prisma.sql`
      FROM "integration"."omie_product" p
      WHERE 1=1
      ${Prisma.join(whereParts, " ")}
    `;

    // ✅ SUMMARY
    const summaryRows = await prisma.$queryRaw<SummaryRow[]>`
      SELECT
        COUNT(*)::bigint AS "total",
        SUM(CASE WHEN (${existsStructure}) THEN 1 ELSE 0 END)::bigint AS "withStructure",
        SUM(CASE WHEN NOT (${existsStructure}) THEN 1 ELSE 0 END)::bigint AS "withoutStructure"
      ${whereSql}
    `;

    const s = summaryRows[0] ?? {
      total: 0,
      withStructure: 0,
      withoutStructure: 0,
    };

    const summary = {
      total: Number(s.total),
      withStructure: Number(s.withStructure),
      withoutStructure: Number(s.withoutStructure),
      canCreateProductionOrder: Number(s.withStructure),
      blockedFromProduction: Number(s.withoutStructure),
    };

    if (view === "summary") {
      return { summary };
    }

    // ✅ DATA
    const rows = await prisma.$queryRaw<DataRow[]>`
      SELECT
        p.omie_code AS "productCode",
        p.description AS "description",
        (${existsStructure}) AS "hasStructure",
        (${existsStructure}) AS "canCreateProductionOrder"
      ${whereSql}
      ORDER BY ${sortSql} ${orderSql}
      LIMIT ${safeLimit}
      OFFSET ${safeOffset}
    `;

    if (view === "data") {
      return { data: rows };
    }

    return { summary, data: rows };
  }
}
