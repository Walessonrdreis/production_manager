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
const omieStock_service_1 = require("../services/omieStock.service");
async function omieRoutes(app) {
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
    app.post('/v1/omie/products/stock/refresh', async (_request, reply) => {
        await OmieStockCache_1.omieStockCache.refreshNow();
        const capturedAt = new Date();
        const stockCacheUpdatedAt = OmieStockCache_1.omieStockCache.getLastUpdatedAt();
        const snapshot = await OmieStockCache_1.omieStockCache.getSnapshot();
        const rows = [];
        for (const [omieCode, entry] of snapshot.entries()) {
            rows.push({
                omieCode,
                stockQuantity: entry?.stockQuantity != null ? String(entry.stockQuantity) : '0',
                minimumStock: entry?.minimumStock != null ? String(entry.minimumStock) : '0',
                capturedAt,
            });
        }
        const BATCH_SIZE = 1000;
        let insertedCount = 0;
        for (let i = 0; i < rows.length; i += BATCH_SIZE) {
            const batch = rows.slice(i, i + BATCH_SIZE);
            const result = await db_1.prisma.productStock.createMany({
                data: batch,
            });
            insertedCount += result?.count ?? 0;
        }
        return reply.send({
            stockCacheUpdatedAt,
            insertedCount,
            capturedAt: capturedAt.toISOString(),
        });
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
            select: { id: true, rawPayload: true },
        });
        if (!omieProduct) {
            throw new AppError_1.AppError('OMIE_PRODUCT_NOT_FOUND', 404, 'Omie product not found');
        }
        const stock = await (0, omieStock_service_1.getStockByRawPayload)(omieProduct.rawPayload);
        return reply.send((0, http_1.ok)({
            omieProductId: omieProduct.id,
            ...stock,
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
        return reply.send((0, http_1.ok)({
            omieCode,
            stockQuantity: String(latest.stockQuantity),
            minimumStock: String(latest.minimumStock),
            capturedAt: latest.capturedAt,
        }));
    });
}
