import { prisma } from "@/shared/db/prisma";
import { Prisma } from "@prisma/client";

// ============================================================
// 📦 Tipos públicos
// ============================================================

export type OpenItemRecord = {
    salesOrderId: string;
    orderNumber: string | null;
    stage: string;
    customerName: string | null;
    customerOmieId: string | null;
    forecastDate: Date | null;
    itemId: string;
    productCode: string;
    description: string;
    unit: string | null;
    quantity: number;
    unitPrice: number | null;
    totalPrice: number | null;
};

export type ListOpenItemsParams = {
    q?: string | null;
    limit?: number;
    offset?: number;
};

export type OpenItemsMeta = {
    total: number;
    pageSize: number;
    pageCount: number;
    offset: number;
};

export type ListOpenItemsResult = {
    meta: OpenItemsMeta;
    data: OpenItemRecord[];
};

// ============================================================
// 🏪 Store
// ============================================================

export class SalesOrderOpenItemsStore {
    /**
     * Lista todos os itens de pedidos de venda em aberto
     * (não cancelados, não encerrados) com nome do cliente via JOIN.
     *
     * 🔥 NÃO cria novas tabelas — consulta SalesOrder + SalesOrderItem + OmieCustomer.
     */
    async list(params: ListOpenItemsParams = {}): Promise<ListOpenItemsResult> {
        const { q = null, limit = 100, offset = 0 } = params;

        const safeLimit = Math.max(1, Math.min(Number(limit || 100), 500));
        const safeOffset = Math.max(0, Number(offset || 0));

        // ── Filtros base ──────────────────────────────────
        const baseCondition = Prisma.sql`
            so.is_canceled = false
            AND so.is_closed = false
        `;

        // ── Filtro de busca textual (opcional) ────────────
        // ✅ Colunas normalizadas com @map() snake_case
        const searchCondition =
            q !== null && q !== ""
                ? Prisma.sql`
                    AND (
                        oc.legal_name ILIKE ${"%" + q + "%"}
                        OR so.order_number ILIKE ${"%" + q + "%"}
                        OR soi.product_code ILIKE ${"%" + q + "%"}
                        OR soi.description ILIKE ${"%" + q + "%"}
                    )
                `
                : Prisma.sql``;

        // ── COUNT ─────────────────────────────────────────
        const countResult = await prisma.$queryRaw<{ count: bigint }[]>`
            SELECT COUNT(*) AS count
            FROM "integration"."sales_order" so
            LEFT JOIN "integration"."omie_customer" oc ON oc.omie_code = so.customer_omie_id
            JOIN "integration"."sales_order_item" soi ON soi.sales_order_id = so.id
            WHERE ${baseCondition} ${searchCondition}
        `;

        const total = Number(countResult[0]?.count ?? 0);

        // ── QUERY ─────────────────────────────────────────
        const rows = await prisma.$queryRaw<any[]>`
            SELECT
                so.id                                   AS sales_order_id,
                so.order_number                         AS order_number,
                so.stage                                AS stage,
                oc.legal_name                           AS customer_name,
                so.customer_omie_id                     AS customer_omie_id,
                so.forecast_date                        AS forecast_date,
                soi.id                                  AS item_id,
                soi.product_code                       AS product_code,
                soi.description                         AS description,
                soi.unit                                AS unit,
                soi.quantity                            AS quantity,
                soi.unit_price                          AS unit_price,
                soi.total_price                         AS total_price
            FROM "integration"."sales_order" so
            LEFT JOIN "integration"."omie_customer" oc ON oc.omie_code = so.customer_omie_id
            JOIN "integration"."sales_order_item" soi ON soi.sales_order_id = so.id
        `;

        // ── Mapeamento ────────────────────────────────────
        const data: OpenItemRecord[] = rows.map((row: any) => ({
            salesOrderId: row.sales_order_id,
            orderNumber: row.order_number,
            stage: row.stage,
            customerName: row.customer_name,
            customerOmieId: row.customer_omie_id,
            forecastDate: row.forecast_date,
            itemId: row.item_id,
            productCode: row.product_code,
            description: row.description,
            unit: row.unit,
            quantity: Number(row.quantity),
            unitPrice: row.unit_price ? Number(row.unit_price) : null,
            totalPrice: row.total_price ? Number(row.total_price) : null,
        }));

        return {
            meta: {
                total,
                pageSize: safeLimit,
                pageCount: data.length,
                offset: safeOffset,
            },
            data,
        };
    }
}
