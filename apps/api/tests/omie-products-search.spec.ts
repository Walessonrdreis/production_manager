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
      omieProduct: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        count: vi.fn(),
      },
      product: {
        findUnique: vi.fn(),
      },
    },
  };
});

import { buildApp } from '../src/app';
import { prisma } from '../src/db';

describe('GET /v1/omie/products/search', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('sem q retorna 400 com error.code VALIDATION_ERROR', async () => {
    const app = await buildApp();
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/v1/omie/products/search',
    });

    expect(response.statusCode).toBe(400);
    expect(response.headers['content-type']).toContain('application/json');

    const body = JSON.parse(response.payload);
    expect(body.error.code).toBe('VALIDATION_ERROR');

    await app.close();
  });

  it('com q retorna 200 com meta.total e paginação respeitada (pageSize clamp <= 100)', async () => {
    (prisma.omieProduct.count as any).mockResolvedValue(4);
    (prisma.omieProduct.findMany as any).mockResolvedValue([
      { id: '1', description: 'Produto Corte A', sku: 'SKU-1', familyDescription: 'Corte', active: true, omieCode: '111' },
      { id: '2', description: 'Produto Corte B', sku: 'SKU-2', familyDescription: 'Corte', active: true, omieCode: '222' },
      { id: '3', description: 'Produto Costura A', sku: 'SKU-3', familyDescription: 'Costura', active: true, omieCode: null },
      { id: '4', description: 'Produto Acabamento', sku: 'SKU-4', familyDescription: 'Acabamento', active: true, omieCode: '444' },
    ]);

    const app = await buildApp();
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/v1/omie/products/search?q=cor&page=1&pageSize=999',
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');

    const body = JSON.parse(response.payload);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.meta.page).toBe(1);
    expect(body.meta.pageSize).toBe(100);
    expect(body.meta.total).toBe(4);
    expect(body.data[0]).toHaveProperty('id');
    expect(body.data[0]).toHaveProperty('description');
    expect(body.data[0]).toHaveProperty('sku');
    expect(body.data[0]).toHaveProperty('familyDescription');
    expect(body.data[0]).toHaveProperty('active');
    expect(body.data[0]).toHaveProperty('omieCode');

    await app.close();
  });
});
