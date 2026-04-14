import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db';
import { SyncOmieProductsService } from '../core/SyncOmieProductsService';
import { OmieAdapter } from '../integrations/omie/OmieAdapter';
import { omieStockCache } from '../integrations/omie/OmieStockCache';
import { ok, paginated, wantsLegacyResponse } from '../lib/http';
import { AppError } from '../core/errors/AppError';
import { getStockByRawPayload } from '../services/omieStock.service';

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

    const capturedAt = new Date();
    const stockCacheUpdatedAt = omieStockCache.getLastUpdatedAt();
    const snapshot = await omieStockCache.getSnapshot();

    const rows: Array<{
      omieCode: string;
      stockQuantity: string;
      minimumStock: string;
      capturedAt: Date;
    }> = [];

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
      const result = await (prisma as any).productStock.createMany({
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

  app.get('/v1/omie/stock', async (_request, reply) => {
    const rows = await prisma.$queryRaw<
      Array<{
        lastRefreshAt: Date | null;
        totalItems: bigint | number | null;
      }>
    >`SELECT MAX("capturedAt") AS "lastRefreshAt", COUNT(DISTINCT "omieCode") AS "totalItems" FROM "product_stock"`;

    const row = rows[0] ?? { lastRefreshAt: null, totalItems: 0 };
    const totalItems =
      typeof row.totalItems === 'bigint'
        ? Number(row.totalItems)
        : row.totalItems ?? 0;

    return reply.send(
      ok({
        lastRefreshAt: row.lastRefreshAt ? row.lastRefreshAt.toISOString() : null,
        totalItems,
        source: 'database',
      })
    );
  });

  app.get('/v1/omie/categories', async (request, reply) => {
    const querySchema = z.object({
      q: z.string().optional(),
    });

    const { q } = querySchema.parse(request.query);
    const normalizedQ = q?.trim();

    const items = (await prisma.omieProduct.findMany({
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
    } as any)) as Array<{ familyDescription: string | null }>;

    const families = items
      .map((item) => item.familyDescription?.trim())
      .filter((value): value is string => Boolean(value));

    return reply.send(
      ok(families, {
        total: families.length,
      })
    );
  });

  app.get('/v1/omie/products/search', async (request, reply) => {
    const querySchema = z.object({
      q: z.string().trim().min(1, 'q is required'),
      page: z.coerce.number().min(1).default(1),
      pageSize: z.coerce.number().min(1).default(20),
    });

    const { q, page, pageSize } = querySchema.parse(request.query);
    const safePageSize = Math.min(pageSize, 100);

    const where = {
      OR: [
        { description: { contains: q, mode: 'insensitive' as const } },
        { sku: { contains: q, mode: 'insensitive' as const } },
        { familyDescription: { contains: q, mode: 'insensitive' as const } },
      ],
    };

    const [total, items] = (await Promise.all([
      prisma.omieProduct.count({ where } as any),
      prisma.omieProduct.findMany({
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
      } as any),
    ])) as [
      number,
      Array<{
        id: string;
        description: string;
        sku: string | null;
        familyDescription: string | null;
        active: boolean;
        omieCode: string | null;
      }>,
    ];

    const paged = items.map((item) => ({
      id: item.id,
      description: item.description,
      sku: item.sku,
      familyDescription: item.familyDescription,
      active: item.active,
      ...(item.omieCode ? { omieCode: item.omieCode } : {}),
    }));

    return reply.send(
      paginated(paged, {
        page,
        pageSize: safePageSize,
        total,
      })
    );
  });

  app.get('/v1/omie/products/:id', async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    const querySchema = z.object({
      includeRaw: z.coerce.boolean().optional().default(false),
    });

    const { id } = paramsSchema.parse(request.params);
    const { includeRaw } = querySchema.parse(request.query);

    const omieProduct = (await prisma.omieProduct.findUnique({
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
    } as any)) as
      | {
          id: string;
          omieId: string;
          omieCode: string | null;
          description: string;
          sku: string | null;
          familyDescription: string | null;
          active: boolean;
          rawPayload: any;
        }
      | null;

    if (!omieProduct) {
      throw new AppError('OMIE_PRODUCT_NOT_FOUND', 404, 'Omie product not found');
    }

    const data: Record<string, unknown> = {
      id: omieProduct.id,
      description: omieProduct.description,
      sku: omieProduct.sku,
      familyDescription: omieProduct.familyDescription ?? OmieAdapter.extractFamilyDescription(omieProduct.rawPayload),
      active: omieProduct.active,
      omieCode: omieProduct.omieCode ?? omieProduct.omieId,
    };

    if (includeRaw) {
      data.rawPayload = omieProduct.rawPayload;
    }

    return reply.send(ok(data));
  });

  app.get('/v1/omie/products/by-code/:omieCode', async (request, reply) => {
    const paramsSchema = z.object({
      omieCode: z.string().min(1),
    });

    const querySchema = z.object({
      includeRaw: z.coerce.boolean().optional().default(false),
    });

    const { omieCode } = paramsSchema.parse(request.params);
    const { includeRaw } = querySchema.parse(request.query);

    const omieProduct = ((await prisma.omieProduct.findFirst({
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
      } as any)) ??
      (await prisma.omieProduct.findUnique({
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
      } as any))) as
      | {
          id: string;
          omieId: string;
          omieCode: string | null;
          description: string;
          sku: string | null;
          familyDescription: string | null;
          active: boolean;
          rawPayload: any;
        }
      | null;

    if (!omieProduct) {
      throw new AppError('OMIE_PRODUCT_NOT_FOUND', 404, 'Omie product not found');
    }

    const data: Record<string, unknown> = {
      id: omieProduct.id,
      description: omieProduct.description,
      sku: omieProduct.sku,
      familyDescription: omieProduct.familyDescription ?? OmieAdapter.extractFamilyDescription(omieProduct.rawPayload),
      active: omieProduct.active,
      omieCode: omieProduct.omieCode ?? omieProduct.omieId,
    };

    if (includeRaw) {
      data.rawPayload = omieProduct.rawPayload;
    }

    return reply.send(ok(data));
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

  app.get('/v1/omie/products/:id/stock', async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    const { id } = paramsSchema.parse(request.params);

    const omieProduct = await prisma.omieProduct.findUnique({
      where: { id },
      select: { id: true, rawPayload: true },
    });

    if (!omieProduct) {
      throw new AppError('OMIE_PRODUCT_NOT_FOUND', 404, 'Omie product not found');
    }

    const stock = await getStockByRawPayload(omieProduct.rawPayload);

    return reply.send(
      ok({
        omieProductId: omieProduct.id,
        ...stock,
      })
    );
  });

  app.get('/v1/omie/products/by-code/:omieCode/stock', async (request, reply) => {
    const paramsSchema = z.object({
      omieCode: z.string().min(1),
    });

    const { omieCode } = paramsSchema.parse(request.params);

    const latestRows = await (prisma as any).productStock.findMany({
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
      throw new AppError('STOCK_NOT_FOUND', 404, 'Stock not found');
    }

    return reply.send(
      ok({
        omieCode,
        stockQuantity: String(latest.stockQuantity),
        minimumStock: String(latest.minimumStock),
        capturedAt: latest.capturedAt,
      })
    );
  });
}
