"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listPublicProducts = listPublicProducts;
exports.getPublicProductByCode = getPublicProductByCode;
const db_1 = require("../db");
async function listPublicProducts(params) {
    const page = Number.isFinite(params.page) ? Math.max(1, Number(params.page)) : 1;
    const pageSizeRaw = Number.isFinite(params.pageSize) ? Number(params.pageSize) : 50;
    const pageSize = Math.min(Math.max(1, pageSizeRaw), 5000);
    const activeOnly = Boolean(params.activeOnly);
    const normalizedQ = params.q?.trim() ? params.q.trim() : null;
    const offset = (page - 1) * pageSize;
    const rows = await db_1.prisma.$queryRaw `
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
    const totalRows = await db_1.prisma.$queryRaw `
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
    const total = typeof totalRaw === 'bigint' ? Number(totalRaw) : Number(totalRaw ?? 0);
    const data = rows.map((row) => ({
        omieCode: row.omieCode,
        description: row.description,
        sku: row.sku,
        family: row.family,
        active: row.active,
        stockQuantity: row.stockQuantity ?? '0.0000',
        minimumStock: row.minimumStock ?? '0.0000',
        stockUpdatedAt: row.stockUpdatedAt ? row.stockUpdatedAt.toISOString() : null,
    }));
    return {
        data,
        meta: {
            page,
            pageSize,
            total,
        },
    };
}
async function getPublicProductByCode(omieCode) {
    const normalizedCode = String(omieCode ?? '').trim();
    if (!normalizedCode)
        return null;
    const rows = await db_1.prisma.$queryRaw `
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
    const row = rows?.[0];
    if (!row)
        return null;
    return {
        omieCode: row.omieCode,
        description: row.description,
        sku: row.sku,
        family: row.family,
        active: row.active,
        stockQuantity: row.stockQuantity ?? '0.0000',
        minimumStock: row.minimumStock ?? '0.0000',
        stockUpdatedAt: row.stockUpdatedAt ? row.stockUpdatedAt.toISOString() : null,
    };
}
