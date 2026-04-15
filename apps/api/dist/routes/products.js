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
async function productsRoutes(app) {
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
    app.get('/v1/products/stock', async (request, reply) => {
        const querySchema = zod_1.z.object({
            q: zod_1.z.string().optional(),
            page: zod_1.z.coerce.number().min(1).default(1),
            pageSize: zod_1.z.coerce.number().min(1).max(5000).default(50),
            activeOnly: zod_1.z.coerce.boolean().optional().default(false),
        });
        const { q, page, pageSize, activeOnly } = querySchema.parse(request.query);
        const normalizedQ = q?.trim() ? q.trim() : null;
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
        o."familyDescription" AS "familyDescription",
        o."active" AS "active",
        COALESCE(to_char(latest_stock."stockQuantity", 'FM999999999999990.0000'), '0.0000') AS "stockQuantity",
        COALESCE(to_char(latest_stock."minimumStock", 'FM999999999999990.0000'), '0.0000') AS "minimumStock",
        latest_stock."capturedAt" AS "stockUpdatedAt",
        COUNT(*) OVER() AS "total"
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
        const totalRaw = rows[0]?.total ?? 0;
        const total = typeof totalRaw === 'bigint' ? Number(totalRaw) : Number(totalRaw ?? 0);
        const data = rows.map((row) => ({
            omieCode: row.omieCode,
            description: row.description,
            sku: row.sku,
            familyDescription: row.familyDescription,
            active: row.active,
            stockQuantity: row.stockQuantity ?? '0.0000',
            minimumStock: row.minimumStock ?? '0.0000',
            stockUpdatedAt: row.stockUpdatedAt ? row.stockUpdatedAt.toISOString() : null,
        }));
        return reply.send((0, http_1.paginated)(data, {
            page,
            pageSize,
            total,
        }));
    });
    // POST /v1/products - Seleciona um produto do Omie para o Gerenciador
    app.post('/v1/products', async (request, reply) => {
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
    });
    // POST /v1/products/bulk - Seleciona vários produtos do Omie para o Gerenciador
    app.post('/v1/products/bulk', async (request, reply) => {
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
    });
    // GET /v1/products - Lista os produtos selecionados
    app.get('/v1/products', async (request, reply) => {
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
    });
    app.get('/v1/products/:id', async (request, reply) => {
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
    });
    app.patch('/v1/products/:id', async (request, reply) => {
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
    });
    // DELETE /v1/products/:id - Remove um produto do Gerenciador
    app.delete('/v1/products/:id', async (request, reply) => {
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
    });
    app.get('/v1/products/:id/stock', async (request, reply) => {
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
    });
    app.get('/v1/products/:id/stock/history', async (request, reply) => {
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
    });
}
