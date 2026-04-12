"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productsRoutes = productsRoutes;
const db_1 = require("../db");
const domainErrors_1 = require("../utils/domainErrors");
const contracts_1 = require("@shared/contracts");
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
