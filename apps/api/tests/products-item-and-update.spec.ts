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
      product: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      omieProduct: {
        findUnique: vi.fn(),
      },
    },
  };
});

import { buildApp } from '../src/app';
import { prisma } from '../src/db';

describe('GET/PATCH /v1/products/:id', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('GET com id inválido retorna 404 PRODUCT_NOT_FOUND', async () => {
    const app = await buildApp();
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/v1/products/not-a-uuid',
    });

    expect(response.statusCode).toBe(404);
    expect(response.headers['content-type']).toContain('application/json');

    const body = JSON.parse(response.payload);
    expect(body.error.code).toBe('PRODUCT_NOT_FOUND');

    await app.close();
  });

  it('GET com id inexistente retorna 404 PRODUCT_NOT_FOUND', async () => {
    (prisma.product.findUnique as any).mockResolvedValue(null);

    const app = await buildApp();
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/v1/products/8eaa43ac-6e71-4fe8-9ea3-2b5e4e3f2d11',
    });

    expect(response.statusCode).toBe(404);

    const body = JSON.parse(response.payload);
    expect(body.error.code).toBe('PRODUCT_NOT_FOUND');

    await app.close();
  });

  it('PATCH alterando nickname retorna 200 e nickname persistido', async () => {
    (prisma.product.findUnique as any).mockResolvedValue({ id: '8eaa43ac-6e71-4fe8-9ea3-2b5e4e3f2d11' });

    (prisma.product.update as any).mockResolvedValue({
      id: '8eaa43ac-6e71-4fe8-9ea3-2b5e4e3f2d11',
      nickname: 'New Nick',
      active: true,
      omieProductId: '0a74a47a-3b19-4f22-9b0f-8b8d41d8c6c6',
    });

    const app = await buildApp();
    await app.ready();

    const response = await app.inject({
      method: 'PATCH',
      url: '/v1/products/8eaa43ac-6e71-4fe8-9ea3-2b5e4e3f2d11',
      payload: { data: { nickname: 'New Nick' } },
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');

    const body = JSON.parse(response.payload);
    expect(body.data.nickname).toBe('New Nick');

    await app.close();
  });
});

