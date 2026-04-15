"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.omieRoutes = omieRoutes;
const zod_1 = require("zod");
const db_1 = require("../db");
const SyncOmieProductsService_1 = require("../core/SyncOmieProductsService");
const OmieAdapter_1 = require("../integrations/omie/OmieAdapter");
const OmieStockCache_1 = require("../integrations/omie/OmieStockCache");
const http_1 = require("../lib/http");
const AppError_1 = require("../core/errors/AppError");
const stockRefresh_service_1 = require("../services/stockRefresh.service");
async function omieRoutes(app) {
    const toNumber = (value) => {
        if (value == null)
            return null;
        if (typeof value === 'number')
            return Number.isFinite(value) ? value : null;
        if (typeof value === 'string') {
            const parsed = Number(value.trim().replace(',', '.'));
            return Number.isFinite(parsed) ? parsed : null;
        }
        if (typeof value?.toNumber === 'function') {
            const num = value.toNumber();
            return Number.isFinite(num) ? num : null;
        }
        const asString = typeof value?.toString === 'function' ? value.toString() : String(value);
        const parsed = Number(String(asString).trim().replace(',', '.'));
        return Number.isFinite(parsed) ? parsed : null;
    };
    app.post('/v1/omie/sync/products', async (request, reply) => {
        const querySchema = zod_1.z.object({
            force: zod_1.z.coerce.boolean().optional().default(false),
        });
        const { force } = querySchema.parse(request.query);
        // A rota instancia e delega ao Service passando o requestId e o param force
        const service = new SyncOmieProductsService_1.SyncOmieProductsService();
        const result = await service.execute(request.requestId, force);
        return reply.send(result);
    });
    app.post('/v1/omie/products/stock/refresh', async (request, reply) => {
        const querySchema = zod_1.z.object({
            dryRun: zod_1.z.string().optional(),
        });
        const { dryRun } = querySchema.parse(request.query);
        const isDryRun = dryRun?.trim() === '1' || dryRun?.trim().toLowerCase() === 'true';
        const capturedAt = new Date().toISOString();
        const result = await (0, stockRefresh_service_1.runStockRefresh)({ dryRun: isDryRun });
        return reply.send((0, http_1.ok)({
            insertedCount: result.insertedCount,
            capturedAt,
        }, result.meta));
    });
    app.get('/v1/omie/stock', async (_request, reply) => {
        const rows = await db_1.prisma.$queryRaw `SELECT MAX("capturedAt") AS "lastRefreshAt", COUNT(DISTINCT "omieCode") AS "totalItems" FROM "product_stock"`;
        const row = rows[0] ?? { lastRefreshAt: null, totalItems: 0 };
        const totalItems = typeof row.totalItems === 'bigint'
            ? Number(row.totalItems)
            : row.totalItems ?? 0;
        return reply.send((0, http_1.ok)({
            lastRefreshAt: row.lastRefreshAt ? row.lastRefreshAt.toISOString() : null,
            totalItems,
            source: 'database',
        }));
    });
    app.get('/v1/omie/categories', async (request, reply) => {
        const querySchema = zod_1.z.object({
            q: zod_1.z.string().optional(),
        });
        const { q } = querySchema.parse(request.query);
        const normalizedQ = q?.trim();
        const items = (await db_1.prisma.omieProduct.findMany({
            select: {
                familyDescription: true,
            },
            distinct: ['familyDescription'],
            orderBy: { familyDescription: 'asc' },
            where: normalizedQ
                ? {
                    familyDescription: {
                        contains: normalizedQ,
                        mode: 'insensitive',
                    },
                }
                : {
                    familyDescription: {
                        not: null,
                    },
                },
        }));
        const families = items
            .map((item) => item.familyDescription?.trim())
            .filter((value) => Boolean(value));
        return reply.send((0, http_1.ok)(families, {
            total: families.length,
        }));
    });
    app.get('/v1/omie/products/search', async (request, reply) => {
        const querySchema = zod_1.z.object({
            q: zod_1.z.string().trim().min(1, 'q is required'),
            page: zod_1.z.coerce.number().min(1).default(1),
            pageSize: zod_1.z.coerce.number().min(1).default(20),
        });
        const { q, page, pageSize } = querySchema.parse(request.query);
        const safePageSize = Math.min(pageSize, 100);
        const where = {
            OR: [
                { description: { contains: q, mode: 'insensitive' } },
                { sku: { contains: q, mode: 'insensitive' } },
                { familyDescription: { contains: q, mode: 'insensitive' } },
            ],
        };
        const [total, items] = (await Promise.all([
            db_1.prisma.omieProduct.count({ where }),
            db_1.prisma.omieProduct.findMany({
                where,
                orderBy: { description: 'asc' },
                skip: (page - 1) * safePageSize,
                take: safePageSize,
                select: {
                    id: true,
                    description: true,
                    sku: true,
                    familyDescription: true,
                    active: true,
                    omieCode: true,
                },
            }),
        ]));
        const paged = items.map((item) => ({
            id: item.id,
            description: item.description,
            sku: item.sku,
            familyDescription: item.familyDescription,
            active: item.active,
            ...(item.omieCode ? { omieCode: item.omieCode } : {}),
        }));
        return reply.send((0, http_1.paginated)(paged, {
            page,
            pageSize: safePageSize,
            total,
        }));
    });
    app.get('/v1/omie/products/:id', async (request, reply) => {
        const paramsSchema = zod_1.z.object({
            id: zod_1.z.string().uuid(),
        });
        const querySchema = zod_1.z.object({
            includeRaw: zod_1.z.coerce.boolean().optional().default(false),
        });
        const { id } = paramsSchema.parse(request.params);
        const { includeRaw } = querySchema.parse(request.query);
        const omieProduct = (await db_1.prisma.omieProduct.findUnique({
            where: { id },
            select: {
                id: true,
                omieId: true,
                omieCode: true,
                description: true,
                sku: true,
                familyDescription: true,
                active: true,
                rawPayload: true,
            },
        }));
        if (!omieProduct) {
            throw new AppError_1.AppError('OMIE_PRODUCT_NOT_FOUND', 404, 'Omie product not found');
        }
        const data = {
            id: omieProduct.id,
            description: omieProduct.description,
            sku: omieProduct.sku,
            familyDescription: omieProduct.familyDescription ?? OmieAdapter_1.OmieAdapter.extractFamilyDescription(omieProduct.rawPayload),
            active: omieProduct.active,
            omieCode: omieProduct.omieCode ?? omieProduct.omieId,
        };
        if (includeRaw) {
            data.rawPayload = omieProduct.rawPayload;
        }
        return reply.send((0, http_1.ok)(data));
    });
    app.get('/v1/omie/products/by-code/:omieCode', async (request, reply) => {
        const paramsSchema = zod_1.z.object({
            omieCode: zod_1.z.string().min(1),
        });
        const querySchema = zod_1.z.object({
            includeRaw: zod_1.z.coerce.boolean().optional().default(false),
        });
        const { omieCode } = paramsSchema.parse(request.params);
        const { includeRaw } = querySchema.parse(request.query);
        const omieProduct = ((await db_1.prisma.omieProduct.findFirst({
            where: { omieCode },
            select: {
                id: true,
                omieId: true,
                omieCode: true,
                description: true,
                sku: true,
                familyDescription: true,
                active: true,
                rawPayload: true,
            },
        })) ??
            (await db_1.prisma.omieProduct.findUnique({
                where: { omieId: omieCode },
                select: {
                    id: true,
                    omieId: true,
                    omieCode: true,
                    description: true,
                    sku: true,
                    familyDescription: true,
                    active: true,
                    rawPayload: true,
                },
            })));
        if (!omieProduct) {
            throw new AppError_1.AppError('OMIE_PRODUCT_NOT_FOUND', 404, 'Omie product not found');
        }
        const data = {
            id: omieProduct.id,
            description: omieProduct.description,
            sku: omieProduct.sku,
            familyDescription: omieProduct.familyDescription ?? OmieAdapter_1.OmieAdapter.extractFamilyDescription(omieProduct.rawPayload),
            active: omieProduct.active,
            omieCode: omieProduct.omieCode ?? omieProduct.omieId,
        };
        if (includeRaw) {
            data.rawPayload = omieProduct.rawPayload;
        }
        return reply.send((0, http_1.ok)(data));
    });
    app.get('/v1/omie/products', async (request, reply) => {
        const querySchema = zod_1.z.object({
            search: zod_1.z.string().optional(),
            family: zod_1.z.string().optional(),
            page: zod_1.z.coerce.number().min(1).default(1),
            pageSize: zod_1.z.coerce.number().min(1).max(5000).default(50),
        });
        const { search, family, page, pageSize } = querySchema.parse(request.query);
        const [items, stockSnapshot] = await Promise.all([
            db_1.prisma.omieProduct.findMany({
                orderBy: {
                    description: 'asc',
                },
            }),
            OmieStockCache_1.omieStockCache.getSnapshot(),
        ]);
        const enrichedItems = items.map((item) => {
            const code = OmieAdapter_1.OmieAdapter.extractProductCode(item.rawPayload) || item.omieId;
            return {
                ...item,
                code,
                familyDescription: OmieAdapter_1.OmieAdapter.extractFamilyDescription(item.rawPayload),
                stockQuantity: stockSnapshot.get(code)?.stockQuantity ?? OmieAdapter_1.OmieAdapter.extractStockQuantity(item.rawPayload),
                minimumStock: stockSnapshot.get(code)?.minimumStock ?? OmieAdapter_1.OmieAdapter.extractMinimumStock(item.rawPayload),
            };
        });
        const normalizedSearch = search?.trim().toLowerCase();
        const normalizedFamily = family?.trim().toLowerCase();
        const filteredItems = enrichedItems.filter((item) => {
            const matchesSearch = normalizedSearch
                ? [
                    item.description,
                    item.sku,
                    item.code,
                    item.omieId,
                    item.familyDescription,
                ]
                    .filter(Boolean)
                    .some((value) => String(value).toLowerCase().includes(normalizedSearch))
                : true;
            const matchesFamily = normalizedFamily
                ? (item.familyDescription ?? '').toLowerCase().includes(normalizedFamily)
                : true;
            return matchesSearch && matchesFamily;
        });
        const families = Array.from(new Set(enrichedItems
            .map((item) => item.familyDescription?.trim())
            .filter((value) => Boolean(value)))).sort((a, b) => a.localeCompare(b));
        const pagedItems = family
            ? filteredItems
            : filteredItems.slice((page - 1) * pageSize, page * pageSize);
        const pageUsed = family ? 1 : page;
        const pageSizeUsed = family ? pagedItems.length : pageSize;
        const stockCacheUpdatedAt = OmieStockCache_1.omieStockCache.getLastUpdatedAt();
        if ((0, http_1.wantsLegacyResponse)(request)) {
            return reply.send({
                items: pagedItems,
                total: filteredItems.length,
                families,
                stockCacheUpdatedAt,
            });
        }
        return reply.send((0, http_1.paginated)(pagedItems, {
            page: pageUsed,
            pageSize: pageSizeUsed,
            total: filteredItems.length,
            families,
            stockCacheUpdatedAt,
        }));
    });
    app.get('/v1/omie/products/:id/stock', async (request, reply) => {
        const paramsSchema = zod_1.z.object({
            id: zod_1.z.string().uuid(),
        });
        const { id } = paramsSchema.parse(request.params);
        const omieProduct = await db_1.prisma.omieProduct.findUnique({
            where: { id },
            select: { id: true, omieCode: true, omieId: true, rawPayload: true },
        });
        if (!omieProduct) {
            throw new AppError_1.AppError('OMIE_PRODUCT_NOT_FOUND', 404, 'Omie product not found');
        }
        const extractedOmieCode = OmieAdapter_1.OmieAdapter.extractProductCode(omieProduct.rawPayload)?.trim();
        const omieCode = extractedOmieCode || omieProduct.omieCode?.trim() || omieProduct.omieId?.trim();
        if (!omieCode) {
            throw new AppError_1.AppError('OMIE_CODE_NOT_FOUND', 422, 'Omie code not found');
        }
        const latestRows = await db_1.prisma.productStock.findMany({
            where: { omieCode },
            orderBy: { capturedAt: 'desc' },
            take: 1,
            select: {
                stockQuantity: true,
                minimumStock: true,
                capturedAt: true,
            },
        });
        const latest = latestRows?.[0];
        if (!latest) {
            throw new AppError_1.AppError('STOCK_NOT_FOUND', 404, 'Stock not found');
        }
        const rawQty = toNumber(latest.stockQuantity);
        const rawMin = toNumber(latest.minimumStock);
        const reported = rawQty != null || rawMin != null;
        const quantity = (rawQty ?? 0).toFixed(4);
        const minimum = (rawMin ?? 0).toFixed(4);
        return reply.send((0, http_1.ok)({
            omieProductId: omieProduct.id,
            omieCode,
            quantity,
            reported,
            rawQuantity: rawQty == null ? null : rawQty.toFixed(4),
            minimum,
            rawMinimum: rawMin == null ? null : rawMin.toFixed(4),
            stockQuantity: quantity,
            minimumStock: minimum,
            stockCacheUpdatedAt: latest.capturedAt.toISOString(),
            capturedAt: latest.capturedAt,
        }));
    });
    app.get('/v1/omie/products/by-code/:omieCode/stock', async (request, reply) => {
        const paramsSchema = zod_1.z.object({
            omieCode: zod_1.z.string().min(1),
        });
        const { omieCode } = paramsSchema.parse(request.params);
        const latestRows = await db_1.prisma.productStock.findMany({
            where: { omieCode },
            orderBy: { capturedAt: 'desc' },
            take: 1,
            select: {
                stockQuantity: true,
                minimumStock: true,
                capturedAt: true,
            },
        });
        const latest = latestRows?.[0];
        if (!latest) {
            throw new AppError_1.AppError('STOCK_NOT_FOUND', 404, 'Stock not found');
        }
        const rawQty = toNumber(latest.stockQuantity);
        const rawMin = toNumber(latest.minimumStock);
        const reported = rawQty != null || rawMin != null;
        const quantity = (rawQty ?? 0).toFixed(4);
        const minimum = (rawMin ?? 0).toFixed(4);
        return reply.send((0, http_1.ok)({
            omieCode,
            quantity,
            reported,
            rawQuantity: rawQty == null ? null : rawQty.toFixed(4),
            minimum,
            rawMinimum: rawMin == null ? null : rawMin.toFixed(4),
            stockQuantity: quantity,
            minimumStock: minimum,
            capturedAt: latest.capturedAt,
        }));
    });
}
