"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productsRoutes = productsRoutes;
const db_1 = require("../db");
const domainErrors_1 = require("../utils/domainErrors");
const contracts_1 = require("@shared/contracts");
const zod_1 = require("zod");
async function productsRoutes(app) {
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
        return reply.send({ items: products });
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
}
