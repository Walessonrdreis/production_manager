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

describe('GET /v1/omie/categories', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('retorna 200 e data como array de strings ordenado', async () => {
    (prisma.omieProduct.findMany as any).mockResolvedValue([
      { familyDescription: 'Corte' },
      { familyDescription: 'Costura' },
      { familyDescription: '' },
      { familyDescription: null },
    ]);

    const app = await buildApp();
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/v1/omie/categories',
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');

    const body = JSON.parse(response.payload);
    expect(body).toEqual({
      data: ['Corte', 'Costura'],
      meta: { total: 2 },
    });
    expect(body.meta.total).toBe(body.data.length);

    await app.close();
  });

  it('com q retorna subconjunto filtrado', async () => {
    (prisma.omieProduct.findMany as any).mockResolvedValue([
      { familyDescription: 'Corte' },
    ]);

    const app = await buildApp();
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/v1/omie/categories?q=cor',
    });

    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.payload);
    expect(body.data).toEqual(['Corte']);
    expect(body.meta.total).toBe(body.data.length);

    await app.close();
  });
});
