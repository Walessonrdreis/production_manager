import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/integrations/omie/OmieStockCache', () => {
  return {
    omieStockCache: {
      getSnapshot: vi.fn(),
      getLastUpdatedAt: vi.fn(),
      refreshNow: vi.fn(),
    },
  };
});

vi.mock('../src/db', () => {
  return {
    prisma: {
      $queryRaw: vi.fn(),
      product: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        createMany: vi.fn(),
        delete: vi.fn(),
      },
      omieProduct: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
      productStock: {
        findMany: vi.fn(),
        count: vi.fn(),
      },
    },
  };
});

import { buildApp } from '../src/app';
import { prisma } from '../src/db';

describe('GET /v1/products/stock', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('retorna 2 itens, com estoque para A e zero/null para B', async () => {
    const omieProducts = [
      {
        omieCode: 'A',
        description: 'Produto A',
        sku: null,
        family: null,
        active: true,
      },
      {
        omieCode: 'B',
        description: 'Produto B',
        sku: null,
        family: null,
        active: true,
      },
    ];

    const productStockRows = [
      {
        omieCode: 'A',
        stockQuantity: 10,
        minimumStock: 2,
        capturedAt: new Date('2026-04-15T00:00:00.000Z'),
      },
    ];

    const formatDecimal = (value: number) => value.toFixed(4);

    let callIndex = 0;
    (prisma.$queryRaw as any).mockImplementation(async () => {
      if (callIndex === 0) {
        const latestStockByCode = new Map<string, { stockQuantity: number; minimumStock: number; capturedAt: Date }>();
        for (const row of productStockRows) {
          const existing = latestStockByCode.get(row.omieCode);
          if (!existing || row.capturedAt.getTime() > existing.capturedAt.getTime()) {
            latestStockByCode.set(row.omieCode, row);
          }
        }

        const rows = omieProducts
          .slice()
          .sort((a, b) => a.description.localeCompare(b.description))
          .map((p) => {
            const stock = latestStockByCode.get(p.omieCode);
            return {
              omieCode: p.omieCode,
              description: p.description,
              sku: p.sku,
              family: p.family,
              active: p.active,
              stockQuantity: stock ? formatDecimal(stock.stockQuantity) : '0.0000',
              minimumStock: stock ? formatDecimal(stock.minimumStock) : '0.0000',
              stockUpdatedAt: stock ? stock.capturedAt : null,
            };
          });

        callIndex += 1;
        return rows;
      }

      callIndex += 1;
      return [{ total: BigInt(omieProducts.length) }];
    });

    const app = await buildApp();
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/v1/products/stock?page=1&pageSize=50',
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['deprecation']).toBe('true');
    const body = JSON.parse(response.payload);
    expect(body).toHaveProperty('data');
    expect(body).toHaveProperty('meta');
    expect(body.meta).toMatchObject({ page: 1, pageSize: 50, total: 2 });

    expect(body.data).toHaveLength(2);
    expect(body.data[0]).toMatchObject({
      omieCode: 'A',
      description: 'Produto A',
      stockQuantity: '10.0000',
      minimumStock: '2.0000',
      stockUpdatedAt: '2026-04-15T00:00:00.000Z',
    });
    expect(body.data[1]).toMatchObject({
      omieCode: 'B',
      description: 'Produto B',
      stockQuantity: '0.0000',
      minimumStock: '0.0000',
      stockUpdatedAt: null,
    });

    expect(prisma.$queryRaw).toHaveBeenCalledTimes(2);

    await app.close();
  });
});
