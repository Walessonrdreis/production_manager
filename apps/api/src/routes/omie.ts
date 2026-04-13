import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db';
import { SyncOmieProductsService } from '../core/SyncOmieProductsService';
import { OmieAdapter } from '../integrations/omie/OmieAdapter';
import { omieStockCache } from '../integrations/omie/OmieStockCache';
import { paginated, wantsLegacyResponse } from '../lib/http';

export async function omieRoutes(app: FastifyInstance) {
  app.post('/v1/omie/sync/products', async (request, reply) => {
    const querySchema = z.object({
      force: z.coerce.boolean().optional().default(false),
    });

    const { force } = querySchema.parse(request.query);

    // A rota instancia e delega ao Service passando o requestId e o param force
    const service = new SyncOmieProductsService();
    const result = await service.execute(request.requestId, force);
    
    return reply.send(result);
  });

  app.post('/v1/omie/products/stock/refresh', async (_request, reply) => {
    await omieStockCache.refreshNow();

    return reply.send({
      stockCacheUpdatedAt: omieStockCache.getLastUpdatedAt(),
    });
  });

  app.get('/v1/omie/products', async (request, reply) => {
    const querySchema = z.object({
      search: z.string().optional(),
      family: z.string().optional(),
      page: z.coerce.number().min(1).default(1),
      pageSize: z.coerce.number().min(1).max(5000).default(50),
    });

    const { search, family, page, pageSize } = querySchema.parse(request.query);

    const [items, stockSnapshot] = await Promise.all([
      prisma.omieProduct.findMany({
        orderBy: {
          description: 'asc',
        },
      }),
      omieStockCache.getSnapshot(),
    ]);

    const enrichedItems = items.map((item) => {
      const code = OmieAdapter.extractProductCode(item.rawPayload) || item.omieId;
      return {
        ...item,
        code,
        familyDescription: OmieAdapter.extractFamilyDescription(item.rawPayload),
        stockQuantity: stockSnapshot.get(code)?.stockQuantity ?? OmieAdapter.extractStockQuantity(item.rawPayload),
        minimumStock: stockSnapshot.get(code)?.minimumStock ?? OmieAdapter.extractMinimumStock(item.rawPayload),
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

    const families = Array.from(
      new Set(
        enrichedItems
          .map((item) => item.familyDescription?.trim())
          .filter((value): value is string => Boolean(value))
      )
    ).sort((a, b) => a.localeCompare(b));

    const pagedItems = family
      ? filteredItems
      : filteredItems.slice((page - 1) * pageSize, page * pageSize);

    const pageUsed = family ? 1 : page;
    const pageSizeUsed = family ? pagedItems.length : pageSize;

    const stockCacheUpdatedAt = omieStockCache.getLastUpdatedAt();

    if (wantsLegacyResponse(request)) {
      return reply.send({
        items: pagedItems,
        total: filteredItems.length,
        families,
        stockCacheUpdatedAt,
      });
    }

    return reply.send(
      paginated(pagedItems, {
        page: pageUsed,
        pageSize: pageSizeUsed,
        total: filteredItems.length,
        families,
        stockCacheUpdatedAt,
      })
    );
  });
}
