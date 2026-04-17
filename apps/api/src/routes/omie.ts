import { FastifyInstance } from 'fastify';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '../db';
import { OmieAdapter } from '../integrations/omie/OmieAdapter';
import { markDeprecated, ok, paginated, wantsLegacyResponse } from '../lib/http';
import { AppError } from '../core/errors/AppError';
import { runStockRefresh } from '../services/stockRefresh.service';
import { runOmieProductSync } from '../services/omieProductSync.service';
import { listOmieProductsWithCurrentStock } from '../services/omieProductRead.service';
import { SyncOmieStage20OrdersService } from '../core/SyncOmieStage20OrdersService'



export async function omieRoutes(app: FastifyInstance) {
  const toNumber = (value: any): number | null => {
    if (value == null) return null;
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
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

  const syncProductsHandler = async (request: any, reply: any) => {
    const querySchema = z.object({
      force: z.coerce.boolean().optional().default(false),
    });

    querySchema.parse(request.query);

    const result = await runOmieProductSync();
    return reply.send(result);
  };

  const productsSyncHandler = async (_request: any, reply: any) => {
    const result = await runOmieProductSync();
    return reply.send(ok(result));
  };

  const stockRefreshHandler = async (request: any, reply: any) => {
    const querySchema = z.object({
      dryRun: z.string().optional(),
    });

    const { dryRun } = querySchema.parse(request.query);
    const isDryRun = dryRun?.trim() === '1' || dryRun?.trim().toLowerCase() === 'true';

    const capturedAt = new Date().toISOString();
    const result = await runStockRefresh({ dryRun: isDryRun });

    return reply.send(
      ok(
        {
          insertedCount: result.insertedCount,
          capturedAt,
        },
        result.meta
      )
    );
  };

  const stockInfoHandler = async (_request: any, reply: any) => {
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
  };

  const categoriesHandler = async (request: any, reply: any) => {
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
  };

  const productsSearchHandler = async (request: any, reply: any) => {
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
  };

  const productByIdHandler = async (request: any, reply: any) => {
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
      omieCode: omieProduct.omieCode,
    };

    if (includeRaw) {
      data.rawPayload = omieProduct.rawPayload;
    }

    return reply.send(ok(data));
  };

  const productByCodeHandler = async (request: any, reply: any) => {
    const paramsSchema = z.object({
      omieCode: z.string().min(1),
    });

    const querySchema = z.object({
      includeRaw: z.coerce.boolean().optional().default(false),
    });

    const { omieCode } = paramsSchema.parse(request.params);
    const { includeRaw } = querySchema.parse(request.query);

    const omieProduct = ((await prisma.omieProduct.findUnique({
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
      (await prisma.omieProduct.findFirst({
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
          omieId: string | null;
          omieCode: string;
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
      omieCode: omieProduct.omieCode,
    };

    if (includeRaw) {
      data.rawPayload = omieProduct.rawPayload;
    }

    return reply.send(ok(data));
  };

  const productsListHandler = async (request: any, reply: any) => {
    const querySchema = z.object({
      search: z.string().optional(),
      family: z.string().optional(),
      page: z.coerce.number().min(1).default(1),
      pageSize: z.coerce.number().min(1).max(5000).default(50),
    });

    const { search, family, page, pageSize } = querySchema.parse(request.query);

    const { items: enrichedItems, stockUpdatedAt } = await listOmieProductsWithCurrentStock();

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

    const stockCacheUpdatedAt = stockUpdatedAt;

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
  };

  const productStockByIdHandler = async (request: any, reply: any) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    const { id } = paramsSchema.parse(request.params);

    const omieProduct = await prisma.omieProduct.findUnique({
      where: { id },
      select: { id: true, omieCode: true, omieId: true, rawPayload: true },
    });

    if (!omieProduct) {
      throw new AppError('OMIE_PRODUCT_NOT_FOUND', 404, 'Omie product not found');
    }

    const extractedOmieCode = OmieAdapter.extractProductCode(omieProduct.rawPayload)?.trim();
    const omieCode = extractedOmieCode || omieProduct.omieCode?.trim() || omieProduct.omieId?.trim();

    if (!omieCode) {
      throw new AppError('OMIE_CODE_NOT_FOUND', 422, 'Omie code not found');
    }

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

    const rawQty = toNumber(latest.stockQuantity);
    const rawMin = toNumber(latest.minimumStock);
    const reported = rawQty != null || rawMin != null;
    const quantity = (rawQty ?? 0).toFixed(4);
    const minimum = (rawMin ?? 0).toFixed(4);

    return reply.send(
      ok({
        omieProductId: omieProduct.id,
        omieCode,
        quantity,
        reported,
        rawQuantity: rawQty == null ? null : rawQty.toFixed(4),
        minimum,
        rawMinimum: rawMin == null ? null : rawMin.toFixed(4),
        stockQuantity: quantity,
        minimumStock: minimum,
        stockCacheUpdatedAt: latest.capturedAt.toISOString(),
        capturedAt: latest.capturedAt,
      })
    );
  };

  const productStockByCodeHandler = async (request: any, reply: any) => {
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

    const rawQty = toNumber(latest.stockQuantity);
    const rawMin = toNumber(latest.minimumStock);
    const reported = rawQty != null || rawMin != null;
    const quantity = (rawQty ?? 0).toFixed(4);
    const minimum = (rawMin ?? 0).toFixed(4);

    return reply.send(
      ok({
        omieCode,
        quantity,
        reported,
        rawQuantity: rawQty == null ? null : rawQty.toFixed(4),
        minimum,
        rawMinimum: rawMin == null ? null : rawMin.toFixed(4),
        stockQuantity: quantity,
        minimumStock: minimum,
        capturedAt: latest.capturedAt,
      })
    );
  };

  app.post('/v1/admin/omie/sync/products', syncProductsHandler);
  app.post('/v1/admin/omie/products/sync', productsSyncHandler);
  app.post('/v1/admin/omie/products/stock/refresh', stockRefreshHandler);
  app.get('/v1/admin/omie/stock', stockInfoHandler);
  app.get('/v1/admin/omie/categories', categoriesHandler);
  app.get('/v1/admin/omie/products/search', productsSearchHandler);
  app.get('/v1/admin/omie/products/:id', productByIdHandler);
  app.get('/v1/admin/omie/products/by-code/:omieCode', productByCodeHandler);
  app.get('/v1/admin/omie/products', productsListHandler);
  app.get('/v1/admin/omie/products/:id/stock', productStockByIdHandler);
  app.get('/v1/admin/omie/products/by-code/:omieCode/stock', productStockByCodeHandler);

  app.post('/v1/omie/sync/products', async (request, reply) => {
    markDeprecated(request, reply, '/v1/omie/sync/products', '/v1/admin/omie/sync/products');
    return syncProductsHandler(request, reply);
  });

  app.post('/v1/omie/products/sync', async (request, reply) => {
    markDeprecated(request, reply, '/v1/omie/products/sync', '/v1/admin/omie/products/sync');
    return productsSyncHandler(request, reply);
  });

  app.post('/v1/omie/products/stock/refresh', async (request, reply) => {
    markDeprecated(request, reply, '/v1/omie/products/stock/refresh', '/v1/admin/omie/products/stock/refresh');
    return stockRefreshHandler(request, reply);
  });

  app.get('/v1/omie/stock', async (request, reply) => {
    markDeprecated(request, reply, '/v1/omie/stock', '/v1/admin/omie/stock');
    return stockInfoHandler(request, reply);
  });

  app.get('/v1/omie/categories', async (request, reply) => {
    markDeprecated(request, reply, '/v1/omie/categories', '/v1/admin/omie/categories');
    return categoriesHandler(request, reply);
  });

  app.get('/v1/omie/products/search', async (request, reply) => {
    markDeprecated(request, reply, '/v1/omie/products/search', '/v1/admin/omie/products/search');
    return productsSearchHandler(request, reply);
  });

  app.get('/v1/omie/products/:id', async (request, reply) => {
    markDeprecated(request, reply, '/v1/omie/products/:id', '/v1/admin/omie/products/:id');
    return productByIdHandler(request, reply);
  });

  app.get('/v1/omie/products/by-code/:omieCode', async (request, reply) => {
    markDeprecated(request, reply, '/v1/omie/products/by-code/:omieCode', '/v1/admin/omie/products/by-code/:omieCode');
    return productByCodeHandler(request, reply);
  });

  app.get('/v1/omie/products', async (request, reply) => {
    markDeprecated(request, reply, '/v1/omie/products', '/v1/admin/omie/products');
    return productsListHandler(request, reply);
  });

  app.get('/v1/omie/products/:id/stock', async (request, reply) => {
    markDeprecated(request, reply, '/v1/omie/products/:id/stock', '/v1/admin/omie/products/:id/stock');
    return productStockByIdHandler(request, reply);
  });

  app.get('/v1/omie/products/by-code/:omieCode/stock', async (request, reply) => {
    markDeprecated(request, reply, '/v1/omie/products/by-code/:omieCode/stock', '/v1/admin/omie/products/by-code/:omieCode/stock');
    return productStockByCodeHandler(request, reply);
  });
  
  app.post('/admin/omie/orders/stage20/sync', async () => {
    const service = new SyncOmieStage20OrdersService()
    const result = await service.run()
    return ok(result)
  })
  
 
app.get('/admin/orders/stage20', async (req) => {
    const querySchema = z.object({
      page: z.coerce.number().int().min(1).default(1),
      pageSize: z.coerce.number().int().min(1).max(200).default(50),
      q: z.string().trim().optional(),
    })

    const { page, pageSize, q } = querySchema.parse(req.query)

    const where = {
      etapa: '20',
      cancelado: 'N',
      encerrado: 'N',
      ...(q
        ? {
            items: {
              some: {
                description: {
                  contains: q,
                  mode: 'insensitive' as const,
                },
              },
            },
          }
        : {}),
    }

    const [total, data] = await Promise.all([
      prisma.omieOrder.count({ where }),
      prisma.omieOrder.findMany({
        where,
        include: {
          items: {
            select: {
              description: true,
              quantity: true,
            },
          },
        },
        orderBy: { lastSyncAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])

    return paginated(
      data,
      { page, pageSize, total },
      {
        self: `/admin/orders/stage20?page=${page}&pageSize=${pageSize}${q ? `&q=${encodeURIComponent(q)}` : ''}`,
      }
    )
  })

}


