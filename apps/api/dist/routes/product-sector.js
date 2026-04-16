"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productSectorRoutes = productSectorRoutes;
const zod_1 = require("zod");
const db_1 = require("../db");
const SetProductDefaultSectorService_1 = require("../services/SetProductDefaultSectorService");
const domainErrors_1 = require("../utils/domainErrors");
const contracts_1 = require("@shared/contracts");
async function productSectorRoutes(app) {
    const logDeprecated = (request, legacyPath, replacementPath) => {
        if (process.env.NODE_ENV === 'test')
            return;
        request.log?.warn?.({ legacyPath, replacementPath, requestId: request.requestId }, 'Deprecated endpoint used');
    };
    // PUT /v1/products/:productId/sector
    const setDefaultSectorHandler = async (request, reply) => {
        const paramsSchema = zod_1.z.object({
            productId: zod_1.z.string().uuid('ID de produto inválido'),
        });
        const paramsResult = paramsSchema.safeParse(request.params);
        if (!paramsResult.success)
            throw new domainErrors_1.ValidationError('ID inválido.', paramsResult.error.format());
        const bodyResult = contracts_1.UpdateProductSectorInputSchema.safeParse(request.body);
        if (!bodyResult.success)
            throw new domainErrors_1.ValidationError('Dados inválidos.', bodyResult.error.format());
        const { productId } = paramsResult.data;
        const { sectorId, notes } = bodyResult.data;
        const service = new SetProductDefaultSectorService_1.SetProductDefaultSectorService();
        const productSector = await service.execute({ productId, sectorId, notes });
        return reply.status(200).send(productSector);
    };
    // GET /v1/products/:productId/sector
    const getDefaultSectorHandler = async (request, reply) => {
        const paramsSchema = zod_1.z.object({
            productId: zod_1.z.string().uuid('ID de produto inválido'),
        });
        const paramsResult = paramsSchema.safeParse(request.params);
        if (!paramsResult.success)
            throw new domainErrors_1.ValidationError('ID inválido.', paramsResult.error.format());
        const { productId } = paramsResult.data;
        // Verifica se o produto existe
        const product = await db_1.prisma.product.findUnique({
            where: { id: productId },
        });
        if (!product) {
            throw new domainErrors_1.NotFoundError('Produto');
        }
        // Busca o mapeamento com os dados do setor populados
        const productSector = await db_1.prisma.productSector.findUnique({
            where: { productId },
            include: {
                sector: true,
            },
        });
        // Se não existir o mapeamento, retorna 200 com null para sinalizar a falta de vínculo
        return reply.send({ data: productSector || null });
    };
    app.put('/v1/admin/managed-products/:productId/sector', setDefaultSectorHandler);
    app.get('/v1/admin/managed-products/:productId/sector', getDefaultSectorHandler);
    app.put('/v1/admin/products/:productId/sector', async (request, reply) => {
        logDeprecated(request, '/v1/admin/products/:productId/sector (PUT)', '/v1/admin/managed-products/:productId/sector (PUT)');
        return setDefaultSectorHandler(request, reply);
    });
    app.get('/v1/admin/products/:productId/sector', async (request, reply) => {
        logDeprecated(request, '/v1/admin/products/:productId/sector (GET)', '/v1/admin/managed-products/:productId/sector (GET)');
        return getDefaultSectorHandler(request, reply);
    });
    app.put('/v1/products/:productId/sector', async (request, reply) => {
        logDeprecated(request, '/v1/products/:productId/sector (PUT)', '/v1/admin/managed-products/:productId/sector (PUT)');
        return setDefaultSectorHandler(request, reply);
    });
    app.get('/v1/products/:productId/sector', async (request, reply) => {
        logDeprecated(request, '/v1/products/:productId/sector (GET)', '/v1/admin/managed-products/:productId/sector (GET)');
        return getDefaultSectorHandler(request, reply);
    });
}
