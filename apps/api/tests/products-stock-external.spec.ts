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

  it('retorna lista paginada com stockQuantity/minimumStock e stockUpdatedAt por item', async () => {
    (prisma.$queryRaw as any).mockResolvedValue([
      {
        omieCode: 'ABC',
        description: 'A',
        sku: null,
        familyDescription: null,
        active: true,
        stockQuantity: '0.0000',
        minimumStock: '0.0000',
        stockUpdatedAt: null,
        total: BigInt(2),
      },
      {
        omieCode: 'XTE',
        description: 'X',
        sku: 'SKU',
        familyDescription: 'Fam',
        active: true,
        stockQuantity: '10.0000',
        minimumStock: '2.0000',
        stockUpdatedAt: new Date('2026-04-15T00:00:00.000Z'),
        total: BigInt(2),
      },
    ]);

    const app = await buildApp();
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/v1/products/stock?q=te&page=1&pageSize=2&activeOnly=true',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body).toHaveProperty('data');
    expect(body).toHaveProperty('meta');
    expect(body.meta).toMatchObject({ page: 1, pageSize: 2, total: 2 });

    expect(body.data).toHaveLength(2);
    expect(body.data[0]).toMatchObject({
      omieCode: 'ABC',
      description: 'A',
      stockQuantity: '0.0000',
      minimumStock: '0.0000',
      stockUpdatedAt: null,
    });
    expect(body.data[1]).toMatchObject({
      omieCode: 'XTE',
      description: 'X',
      stockQuantity: '10.0000',
      minimumStock: '2.0000',
      stockUpdatedAt: '2026-04-15T00:00:00.000Z',
    });

    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);

    await app.close();
  });
});

