"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listOmieProductsWithCurrentStock = listOmieProductsWithCurrentStock;
const db_1 = require("../db");
const OmieAdapter_1 = require("../integrations/omie/OmieAdapter");
function toStringOrNull(value) {
    if (value === undefined || value === null)
        return null;
    const s = typeof value === 'string' ? value : typeof value?.toString === 'function' ? value.toString() : String(value);
    const trimmed = String(s).trim();
    return trimmed.length > 0 ? trimmed : null;
}
async function listOmieProductsWithCurrentStock() {
    const items = await db_1.prisma.omieProduct.findMany({
        orderBy: { description: 'asc' },
    });
    const codes = Array.from(new Set(items.map((item) => String(item.omieCode).trim()).filter(Boolean)));
    if (codes.length === 0) {
        return { items: [], stockUpdatedAt: null };
    }
    const stockRows = await db_1.prisma.productStock.findMany({
        where: { omieCode: { in: codes } },
        select: {
            omieCode: true,
            stockQuantity: true,
            minimumStock: true,
            updatedAt: true,
            capturedAt: true,
        },
    });
    const stockByCode = new Map();
    let latestUpdatedAt = null;
    for (const row of stockRows) {
        const code = String(row.omieCode).trim();
        stockByCode.set(code, row);
        const candidate = (row.updatedAt ?? row.capturedAt) ?? null;
        if (candidate && (!latestUpdatedAt || candidate.getTime() > latestUpdatedAt.getTime())) {
            latestUpdatedAt = candidate;
        }
    }
    const enriched = items.map((item) => {
        const code = String(item.omieCode).trim();
        const stock = stockByCode.get(code);
        const stockQuantity = toStringOrNull(stock?.stockQuantity) ?? '0';
        const minimumStock = toStringOrNull(stock?.minimumStock) ?? '0';
        return {
            ...item,
            code,
            familyDescription: item.familyDescription ?? OmieAdapter_1.OmieAdapter.extractFamilyDescription(item.rawPayload),
            stockQuantity,
            minimumStock,
        };
    });
    return {
        items: enriched,
        stockUpdatedAt: latestUpdatedAt ? latestUpdatedAt.toISOString() : null,
    };
}
