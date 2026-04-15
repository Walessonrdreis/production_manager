"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productsRoutes = productsRoutes;
const db_1 = require("../db");
const domainErrors_1 = require("../utils/domainErrors");
const contracts_1 = require("@shared/contracts");
const zod_1 = require("zod");
const http_1 = require("../lib/http");
const AppError_1 = require("../core/errors/AppError");
const OmieAdapter_1 = require("../integrations/omie/OmieAdapter");
const publicProductsRead_service_1 = require("../services/publicProductsRead.service");
async function productsRoutes(app) {
    const logDeprecated = (request, legacyPath, replacementPath) => {
        if (process.env.NODE_ENV === 'test')
            return;
        request.log?.warn?.({ legacyPath, replacementPath, requestId: request.requestId }, 'Deprecated endpoint used');
    };
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
    const publicListProductsHandler = async (request, reply) => {
        const querySchema = zod_1.z.object({
            q: zod_1.z.string().optional(),
            page: zod_1.z.coerce.number().min(1).default(1),
            pageSize: zod_1.z.coerce.number().min(1).max(5000).default(50),
            activeOnly: zod_1.z.coerce.boolean().optional().default(false),
        });
        const { q, page, pageSize, activeOnly } = querySchema.parse(request.query);
        const { data, meta } = await (0, publicProductsRead_service_1.listPublicProducts)({
            q,
            page,
            pageSize,
            activeOnly,
        });
        return reply.send((0, http_1.paginated)(data, meta));
    };
    const publicGetProductByOmieCodeHandler = async (request, reply) => {
        const paramsSchema = zod_1.z.object({
            omieCode: zod_1.z.string().min(1),
        });
        const { omieCode } = paramsSchema.parse(request.params);
        const product = await (0, publicProductsRead_service_1.getPublicProductByCode)(omieCode);
        if (!product)
            throw new AppError_1.AppError('OMIE_PRODUCT_NOT_FOUND', 404, 'Omie product not found');
        return reply.send((0, http_1.ok)(product));
    };
    async function resolveOmieCodeFromProduct(productId) {
        const product = await db_1.prisma.product.findUnique({
            where: { id: productId },
            select: { id: true, omieProductId: true },
        });
        if (!product) {
            throw new AppError_1.AppError('PRODUCT_NOT_FOUND', 404, 'Product not found');
        }
        if (!product.omieProductId) {
            throw new AppError_1.AppError('OMIE_PRODUCT_LINK_MISSING', 409, 'Product is not linked to an OmieProduct');
        }
        const omieProduct = await db_1.prisma.omieProduct.findUnique({
            where: { id: product.omieProductId },
            select: { omieCode: true, omieId: true, rawPayload: true },
        });
        if (!omieProduct) {
            throw new AppError_1.AppError('OMIE_PRODUCT_NOT_FOUND', 404, 'Omie product not found');
        }
        const extractedOmieCode = OmieAdapter_1.OmieAdapter.extractProductCode(omieProduct.rawPayload)?.trim();
        const omieCode = extractedOmieCode || omieProduct.omieCode || omieProduct.omieId;
        if (!omieCode) {
            throw new AppError_1.AppError('OMIE_CODE_NOT_FOUND', 422, 'Omie code not found');
        }
        return { productId: product.id, omieCode };
    }
    app.get('/v1/products', publicListProductsHandler);
    app.get('/v1/products/:omieCode([A-Za-z0-9]{1,64})', publicGetProductByOmieCodeHandler);
    app.get('/v1/products/stock', async (request, reply) => {
        logDeprecated(request, '/v1/products/stock', '/v1/products');
        return publicListProductsHandler(request, reply);
    });
    // POST /v1/products - Seleciona um produto do Omie para o Gerenciador
    const createManagedProductHandler = async (request, reply) => {
        const parseResult = contracts_1.CreateProductInputSchema.safeParse(request.body);
        if (!parseResult.success) {
            throw new domainErrors_1.ValidationError('Corpo da requisição inválido', parseResult.error.format());
        }
        const { omieProductId } = parseResult.data;
        const omieProduct = await db_1.prisma.omieProduct.findUnique({
            where: { id: omieProductId },
        });
        if (!omieProduct) {
            throw new domainErrors_1.NotFoundError('Produto Omie');
        }
        const existing = await db_1.prisma.product.findUnique({
            where: { omieProductId },
        });
        if (existing) {
            throw new domainErrors_1.ConflictError('Produto já está selecionado.');
        }
        const product = await db_1.prisma.product.create({
            data: {
                omieProductId,
            },
        });
        return reply.status(201).send(product);
    };
    app.post('/v1/admin/products', createManagedProductHandler);
    app.post('/v1/products', async (request, reply) => {
        logDeprecated(request, '/v1/products (POST)', '/v1/admin/products (POST)');
        return createManagedProductHandler(request, reply);
    });
    // POST /v1/products/bulk - Seleciona vários produtos do Omie para o Gerenciador
    const createManagedProductsBulkHandler = async (request, reply) => {
        const schema = zod_1.z.object({
            omieProductIds: zod_1.z.array(zod_1.z.string().uuid()).min(1).max(5000),
        });
        const parseResult = schema.safeParse(request.body);
        if (!parseResult.success) {
            throw new domainErrors_1.ValidationError('Corpo da requisição inválido', parseResult.error.format());
        }
        const uniqueIds = Array.from(new Set(parseResult.data.omieProductIds));
        const omieProducts = await db_1.prisma.omieProduct.findMany({
            where: { id: { in: uniqueIds } },
            select: { id: true },
        });
        const omieProductIdSet = new Set(omieProducts.map((item) => item.id));
        const missingIds = uniqueIds.filter((id) => !omieProductIdSet.has(id));
        if (missingIds.length > 0) {
            throw new domainErrors_1.ValidationError('Alguns produtos Omie não existem.', { missingIds });
        }
        const existingProducts = await db_1.prisma.product.findMany({
            where: { omieProductId: { in: uniqueIds } },
            select: { omieProductId: true },
        });
        const existingIdSet = new Set(existingProducts.map((item) => item.omieProductId));
        const toCreate = uniqueIds.filter((omieProductId) => !existingIdSet.has(omieProductId));
        const createResult = await db_1.prisma.product.createMany({
            data: toCreate.map((omieProductId) => ({ omieProductId })),
            skipDuplicates: true,
        });
        return reply.status(201).send({
            created: createResult.count,
            skippedExisting: existingIdSet.size,
            requested: uniqueIds.length,
        });
    };
    app.post('/v1/admin/products/bulk', createManagedProductsBulkHandler);
    app.post('/v1/products/bulk', async (request, reply) => {
        logDeprecated(request, '/v1/products/bulk (POST)', '/v1/admin/products/bulk (POST)');
        return createManagedProductsBulkHandler(request, reply);
    });
    const listManagedProductsHandler = async (request, reply) => {
        const products = await db_1.prisma.product.findMany({
            include: {
                omieProduct: true,
                productSector: {
                    include: {
                        sector: true,
                    }
                }
            },
            orderBy: {
                omieProduct: {
                    description: 'asc'
                }
            }
        });
        if ((0, http_1.wantsLegacyResponse)(request)) {
            return reply.send({ items: products });
        }
        return reply.send((0, http_1.paginated)(products, {
            page: 1,
            pageSize: products.length,
            total: products.length,
        }));
    };
    app.get('/v1/admin/products', listManagedProductsHandler);
    app.get('/v1/products/managed', async (request, reply) => {
        logDeprecated(request, '/v1/products/managed', '/v1/admin/products');
        return listManagedProductsHandler(request, reply);
    });
    const getManagedProductHandler = async (request, reply) => {
        const paramsSchema = zod_1.z.object({
            id: zod_1.z.string(),
        });
        const { id } = paramsSchema.parse(request.params);
        const looksLikeUuid = zod_1.z.string().uuid().safeParse(id).success;
        if (!looksLikeUuid) {
            throw new AppError_1.AppError('PRODUCT_NOT_FOUND', 404, 'Product not found');
        }
        const product = await db_1.prisma.product.findUnique({
            where: { id },
            include: {
                omieProduct: true,
                productSector: {
                    include: {
                        sector: true,
                    },
                },
            },
        });
        if (!product) {
            throw new AppError_1.AppError('PRODUCT_NOT_FOUND', 404, 'Product not found');
        }
        return reply.send((0, http_1.ok)({
            id: product.id,
            nickname: product.nickname,
            active: product.active,
            omieProductId: product.omieProductId,
            omieProduct: {
                id: product.omieProduct.id,
                description: product.omieProduct.description,
                sku: product.omieProduct.sku,
                familyDescription: OmieAdapter_1.OmieAdapter.extractFamilyDescription(product.omieProduct.rawPayload),
                active: product.omieProduct.active,
            },
            productSector: product.productSector
                ? {
                    sectorId: product.productSector.sectorId,
                    notes: product.productSector.notes,
                    sector: {
                        id: product.productSector.sector.id,
                        name: product.productSector.sector.name,
                        order: product.productSector.sector.order,
                    },
                }
                : null,
        }));
    };
    app.get('/v1/admin/products/:id', getManagedProductHandler);
    app.get('/v1/products/:id', async (request, reply) => {
        logDeprecated(request, '/v1/products/:id', '/v1/admin/products/:id');
        return getManagedProductHandler(request, reply);
    });
    const patchManagedProductHandler = async (request, reply) => {
        const paramsSchema = zod_1.z.object({
            id: zod_1.z.string().uuid(),
        });
        const bodySchema = zod_1.z.object({
            data: zod_1.z
                .object({
                nickname: zod_1.z.string().trim().min(1).optional(),
                active: zod_1.z.boolean().optional(),
            })
                .refine((value) => value.nickname !== undefined || value.active !== undefined, {
                message: 'At least one field is required',
            }),
        });
        const { id } = paramsSchema.parse(request.params);
        const { data } = bodySchema.parse(request.body);
        const existing = await db_1.prisma.product.findUnique({
            where: { id },
            select: { id: true },
        });
        if (!existing) {
            throw new AppError_1.AppError('PRODUCT_NOT_FOUND', 404, 'Product not found');
        }
        const updated = await db_1.prisma.product.update({
            where: { id },
            data: {
                ...(data.nickname !== undefined ? { nickname: data.nickname } : {}),
                ...(data.active !== undefined ? { active: data.active } : {}),
            },
            select: {
                id: true,
                nickname: true,
                active: true,
                omieProductId: true,
            },
        });
        return reply.send((0, http_1.ok)(updated));
    };
    app.patch('/v1/admin/products/:id', patchManagedProductHandler);
    app.patch('/v1/products/:id', async (request, reply) => {
        logDeprecated(request, '/v1/products/:id (PATCH)', '/v1/admin/products/:id (PATCH)');
        return patchManagedProductHandler(request, reply);
    });
    // DELETE /v1/products/:id - Remove um produto do Gerenciador
    const deleteManagedProductHandler = async (request, reply) => {
        // Como é params não usamos contrato compartilhado aqui
        const { id } = request.params;
        const product = await db_1.prisma.product.findUnique({
            where: { id },
        });
        if (!product) {
            throw new domainErrors_1.NotFoundError('Produto');
        }
        await db_1.prisma.product.delete({
            where: { id },
        });
        return reply.send({ success: true });
    };
    app.delete('/v1/admin/products/:id', deleteManagedProductHandler);
    app.delete('/v1/products/:id', async (request, reply) => {
        logDeprecated(request, '/v1/products/:id (DELETE)', '/v1/admin/products/:id (DELETE)');
        return deleteManagedProductHandler(request, reply);
    });
    const getManagedProductStockHandler = async (request, reply) => {
        const paramsSchema = zod_1.z.object({
            id: zod_1.z.string().uuid(),
        });
        const { id } = paramsSchema.parse(request.params);
        const { productId, omieCode } = await resolveOmieCodeFromProduct(id);
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
        const latest = latestRows[0];
        if (!latest) {
            throw new AppError_1.AppError('STOCK_NOT_FOUND', 404, 'Stock not found');
        }
        const rawQty = toNumber(latest.stockQuantity);
        const rawMin = toNumber(latest.minimumStock);
        const reported = rawQty != null || rawMin != null;
        const quantity = (rawQty ?? 0).toFixed(4);
        const minimum = (rawMin ?? 0).toFixed(4);
        return reply.send((0, http_1.ok)({
            productId,
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
    };
    app.get('/v1/admin/products/:id/stock', getManagedProductStockHandler);
    app.get('/v1/products/:id/stock', async (request, reply) => {
        logDeprecated(request, '/v1/products/:id/stock', '/v1/admin/products/:id/stock');
        return getManagedProductStockHandler(request, reply);
    });
    const getManagedProductStockHistoryHandler = async (request, reply) => {
        const paramsSchema = zod_1.z.object({
            id: zod_1.z.string().uuid(),
        });
        const querySchema = zod_1.z.object({
            page: zod_1.z.coerce.number().min(1).default(1),
            pageSize: zod_1.z.coerce.number().min(1).default(50),
        });
        const { id } = paramsSchema.parse(request.params);
        const { page, pageSize } = querySchema.parse(request.query);
        const safePageSize = Math.min(pageSize, 100);
        const { productId, omieCode } = await resolveOmieCodeFromProduct(id);
        const [total, rows] = await Promise.all([
            db_1.prisma.productStock.count({ where: { omieCode } }),
            db_1.prisma.productStock.findMany({
                where: { omieCode },
                orderBy: { capturedAt: 'desc' },
                skip: (page - 1) * safePageSize,
                take: safePageSize,
                select: {
                    stockQuantity: true,
                    minimumStock: true,
                    capturedAt: true,
                },
            }),
        ]);
        return reply.send((0, http_1.paginated)(rows.map((row) => {
            const rawQty = toNumber(row.stockQuantity);
            const rawMin = toNumber(row.minimumStock);
            const reported = rawQty != null || rawMin != null;
            const quantity = (rawQty ?? 0).toFixed(4);
            const minimum = (rawMin ?? 0).toFixed(4);
            return {
                productId,
                omieCode,
                quantity,
                reported,
                rawQuantity: rawQty == null ? null : rawQty.toFixed(4),
                minimum,
                rawMinimum: rawMin == null ? null : rawMin.toFixed(4),
                stockQuantity: quantity,
                minimumStock: minimum,
                capturedAt: row.capturedAt,
            };
        }), {
            page,
            pageSize: safePageSize,
            total,
        }));
    };
    app.get('/v1/admin/products/:id/stock/history', getManagedProductStockHistoryHandler);
    app.get('/v1/products/:id/stock/history', async (request, reply) => {
        logDeprecated(request, '/v1/products/:id/stock/history', '/v1/admin/products/:id/stock/history');
        return getManagedProductStockHistoryHandler(request, reply);
    });
}
