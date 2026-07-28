import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/db', () => {
  return {
    prisma: {
      $queryRaw: vi.fn(),
    },
  };
});

import { buildApp } from '../src/app';
import { prisma } from '../src/db';

describe('Public contract: GET /v1/products (+ /v1/products/:omieCode)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('GET /v1/products retorna { data, meta } com chaves públicas (omieCode) e sem UUID interno', async () => {
    (prisma.$queryRaw as any)
      .mockResolvedValueOnce([
        {
          omieCode: '12345',
          description: 'Produto A',
          sku: 'SKU-A',
          family: 'Família X',
          active: true,
          stockQuantity: '10.0000',
          minimumStock: '2.0000',
          stockUpdatedAt: new Date('2026-04-14T12:00:00.000Z'),
        },
        {
          omieCode: '999',
          description: 'Produto Sem Estoque',
          sku: null,
          family: null,
          active: true,
          stockQuantity: '0.0000',
          minimumStock: '0.0000',
          stockUpdatedAt: null,
        },
      ])
      .mockResolvedValueOnce([{ total: 2n }]);

    const app = await buildApp();
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/v1/products?page=1&pageSize=50',
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');

    const body = JSON.parse(response.payload);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.meta).toEqual({ page: 1, pageSize: 50, total: 2 });

    const itemA = body.data[0];
    expect(itemA).toEqual({
      omieCode: '12345',
      description: 'Produto A',
      sku: 'SKU-A',
      family: 'Família X',
      active: true,
      stockQuantity: '10.0000',
      minimumStock: '2.0000',
      stockUpdatedAt: '2026-04-14T12:00:00.000Z',
    });

    const itemNoStock = body.data[1];
    expect(itemNoStock).toEqual({
      omieCode: '999',
      description: 'Produto Sem Estoque',
      sku: null,
      family: null,
      active: true,
      stockQuantity: '0.0000',
      minimumStock: '0.0000',
      stockUpdatedAt: null,
    });

    expect(itemA).not.toHaveProperty('id');
    expect(itemA).not.toHaveProperty('omieProductId');
    expect(itemA).not.toHaveProperty('rawPayload');

    expect(itemNoStock).not.toHaveProperty('id');
    expect(itemNoStock).not.toHaveProperty('omieProductId');
    expect(itemNoStock).not.toHaveProperty('rawPayload');

    await app.close();
  });

  it('GET /v1/products/:omieCode retorna { data } com os mesmos campos públicos', async () => {
    (prisma.$queryRaw as any).mockResolvedValueOnce([
      {
        omieCode: '777',
        description: 'Produto 777',
        sku: null,
        family: null,
        active: true,
        stockQuantity: '0.0000',
        minimumStock: '0.0000',
        stockUpdatedAt: null,
      },
    ]);

    const app = await buildApp();
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/v1/products/777',
    });

    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.payload);
    expect(body.data).toEqual({
      omieCode: '777',
      description: 'Produto 777',
      sku: null,
      family: null,
      active: true,
      stockQuantity: '0.0000',
      minimumStock: '0.0000',
      stockUpdatedAt: null,
    });

    await app.close();
  });

  it('GET /v1/products/:omieCode retorna erro padronizado quando não existe', async () => {
    (prisma.$queryRaw as any).mockResolvedValueOnce([]);

    const app = await buildApp();
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/v1/products/99999',
    });

    expect(response.statusCode).toBe(404);
    expect(response.headers['content-type']).toContain('application/json');

    const body = JSON.parse(response.payload);
    expect(body.error.code).toBe('PRODUCT_NOT_FOUND');
    expect(body.error.message).toBeDefined();
    expect(body.error.requestId).toBeDefined();

    await app.close();
  });
});
