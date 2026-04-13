"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.omieRoutes = omieRoutes;
const zod_1 = require("zod");
const db_1 = require("../db");
const SyncOmieProductsService_1 = require("../core/SyncOmieProductsService");
const OmieAdapter_1 = require("../integrations/omie/OmieAdapter");
const OmieStockCache_1 = require("../integrations/omie/OmieStockCache");
async function omieRoutes(app) {
    // Rota de Sincronização
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
    // Rota de Listagem do Espelho Local
    app.get('/v1/omie/products', async (request, reply) => {
        const querySchema = zod_1.z.object({
            search: zod_1.z.string().optional(),
            page: zod_1.z.coerce.number().min(1).default(1),
            pageSize: zod_1.z.coerce.number().min(1).max(100).default(50),
        });
        const { search, page, pageSize } = querySchema.parse(request.query);
        // Filtro condicional por descrição (case-insensitive)
        const where = search
            ? {
                description: {
                    contains: search,
                    mode: 'insensitive', // Específico para o provider PostgreSQL
                },
            }
            : {};
        // Executa contagem total e busca paginada em paralelo
        const [items, total, stockSnapshot] = await Promise.all([
            db_1.prisma.omieProduct.findMany({
                where,
                skip: (page - 1) * pageSize,
                take: pageSize,
                orderBy: {
                    description: 'asc',
                },
            }),
            db_1.prisma.omieProduct.count({ where }),
            OmieStockCache_1.omieStockCache.getSnapshot(),
        ]);
        return reply.send({
            items: items.map((item) => ({
                ...item,
                code: OmieAdapter_1.OmieAdapter.extractProductCode(item.rawPayload),
                stockQuantity: stockSnapshot.get(OmieAdapter_1.OmieAdapter.extractProductCode(item.rawPayload) || item.omieId)?.stockQuantity
                    ?? OmieAdapter_1.OmieAdapter.extractStockQuantity(item.rawPayload),
                minimumStock: stockSnapshot.get(OmieAdapter_1.OmieAdapter.extractProductCode(item.rawPayload) || item.omieId)?.minimumStock
                    ?? OmieAdapter_1.OmieAdapter.extractMinimumStock(item.rawPayload),
            })),
            total,
        });
    });
}
