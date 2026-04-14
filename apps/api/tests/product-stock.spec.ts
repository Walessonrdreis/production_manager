import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/integrations/omie/OmieStockCache', () => {
  return {
    omieStockCache: {
      getSnapshot: vi.fn(),
      getLastUpdatedAt: vi.fn(),
    },
  };
});

vi.mock('../src/db', () => {
  return {
    prisma: {
      product: {
        findUnique: vi.fn(),
      },
      omieProduct: {
        findUnique: vi.fn(),
      },
    },
  };
});

import { buildApp } from '../src/app';
import { prisma } from '../src/db';
import { omieStockCache } from '../src/integrations/omie/OmieStockCache';

describe('Stock endpoints', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('GET /v1/products/:id/stock - retorna 200 e payload mínimo', async () => {
    (prisma.product.findUnique as any).mockResolvedValue({
      id: '8eaa43ac-6e71-4fe8-9ea3-2b5e4e3f2d11',
      omieProductId: '0a74a47a-3b19-4f22-9b0f-8b8d41d8c6c6',
    });

    (prisma.omieProduct.findUnique as any).mockResolvedValue({
      id: '0a74a47a-3b19-4f22-9b0f-8b8d41d8c6c6',
      rawPayload: { codigo: '12345' },
    });

    (omieStockCache.getSnapshot as any).mockResolvedValue(
      new Map([
        [
          '12345',
          { stockQuantity: '10', minimumStock: '2', updatedAt: '2026-04-14T12:00:00.000Z' },
        ],
      ])
    );
    (omieStockCache.getLastUpdatedAt as any).mockReturnValue('2026-04-14T12:00:00.000Z');

    const app = await buildApp();
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/v1/products/8eaa43ac-6e71-4fe8-9ea3-2b5e4e3f2d11/stock',
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');

    const body = JSON.parse(response.payload);
    expect(body).toHaveProperty('data');
    expect(body.data).toMatchObject({
      productId: '8eaa43ac-6e71-4fe8-9ea3-2b5e4e3f2d11',
      omieProductId: '0a74a47a-3b19-4f22-9b0f-8b8d41d8c6c6',
      omieCode: '12345',
      stockQuantity: '10',
      minimumStock: '2',
      stockCacheUpdatedAt: '2026-04-14T12:00:00.000Z',
    });

    await app.close();
  });

  it('GET /v1/products/:id/stock - id inexistente retorna 404 e error.code', async () => {
    (prisma.product.findUnique as any).mockResolvedValue(null);

    const app = await buildApp();
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/v1/products/8eaa43ac-6e71-4fe8-9ea3-2b5e4e3f2d11/stock',
    });

    expect(response.statusCode).toBe(404);
    expect(response.headers['content-type']).toContain('application/json');

    const body = JSON.parse(response.payload);
    expect(body).toHaveProperty('error');
    expect(body.error.code).toBe('PRODUCT_NOT_FOUND');

    await app.close();
  });

  it('GET /v1/omie/products/by-code/:omieCode/stock - retorna 200 com "0" quando ausente, mas com stockCacheUpdatedAt se snapshot existir', async () => {
    (omieStockCache.getSnapshot as any).mockResolvedValue(new Map());
    (omieStockCache.getLastUpdatedAt as any).mockReturnValue('2026-04-14T12:00:00.000Z');

    const app = await buildApp();
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/v1/omie/products/by-code/99999/stock',
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');

    const body = JSON.parse(response.payload);
    expect(body).toHaveProperty('data');
    expect(body.data).toMatchObject({
      omieCode: '99999',
      stockQuantity: '0',
      minimumStock: '0',
      stockCacheUpdatedAt: '2026-04-14T12:00:00.000Z',
    });

    await app.close();
  });
});

