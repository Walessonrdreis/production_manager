"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.omieRoutes = omieRoutes;
const zod_1 = require("zod");
const db_1 = require("../db");
const SyncOmieProductsService_1 = require("../core/SyncOmieProductsService");
const OmieAdapter_1 = require("../integrations/omie/OmieAdapter");
const OmieStockCache_1 = require("../integrations/omie/OmieStockCache");
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
        return reply.send({
            stockCacheUpdatedAt: OmieStockCache_1.omieStockCache.getLastUpdatedAt(),
        });
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
        return reply.send({
            items: pagedItems,
            total: filteredItems.length,
            families,
            stockCacheUpdatedAt: OmieStockCache_1.omieStockCache.getLastUpdatedAt(),
        });
    });
}
