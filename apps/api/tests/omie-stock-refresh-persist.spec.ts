import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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
      productStock: {
        createMany: vi.fn(),
      },
    },
  };
});

import { buildApp } from '../src/app';
import { omieStockCache } from '../src/integrations/omie/OmieStockCache';
import { prisma } from '../src/db';

describe('POST /v1/omie/products/stock/refresh (persist history)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('persiste um snapshot no product_stock (1 linha por omieCode) e retorna insertedCount e capturedAt', async () => {
    (omieStockCache.refreshNow as any).mockResolvedValue(undefined);
    (omieStockCache.getSnapshot as any).mockResolvedValue(
      {
        items: {
          '123': { stockQuantity: 10, minimumStock: 2 },
          '456': { stockQuantity: 0, minimumStock: 5 },
        },
      }
    );

    (prisma.productStock.createMany as any).mockResolvedValue({ count: 2 });

    const app = await buildApp();
    await app.ready();

    const response = await app.inject({
      method: 'POST',
      url: '/v1/omie/products/stock/refresh',
      payload: {},
      headers: { 'content-type': 'application/json' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');

    const body = JSON.parse(response.payload);
    expect(body.data.insertedCount).toBe(2);
    expect(typeof body.data.capturedAt).toBe('string');
    expect(new Date(body.data.capturedAt).toISOString()).toBe(body.data.capturedAt);

    expect(prisma.productStock.createMany).toHaveBeenCalledTimes(1);
    const args = (prisma.productStock.createMany as any).mock.calls[0][0];
    expect(args.data).toHaveLength(2);
    expect(args.data[0]).toMatchObject({
      omieCode: '123',
      stockQuantity: '10',
      minimumStock: '2',
    });
    expect(args.data[1]).toMatchObject({
      omieCode: '456',
      stockQuantity: '0',
      minimumStock: '5',
    });

    expect(args.data[0].capturedAt).toBeInstanceOf(Date);
    expect(args.data[1].capturedAt).toBeInstanceOf(Date);
    expect(args.data[1].capturedAt.getTime()).toBe(args.data[0].capturedAt.getTime());

    await app.close();
  });

  it('snapshot vazio retorna insertedCount 0 e não chama createMany', async () => {
    (omieStockCache.refreshNow as any).mockResolvedValue(undefined);
    (omieStockCache.getSnapshot as any).mockResolvedValue({ items: {} });

    const app = await buildApp();
    await app.ready();

    const response = await app.inject({
      method: 'POST',
      url: '/v1/omie/products/stock/refresh',
      payload: {},
      headers: { 'content-type': 'application/json' },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.data.insertedCount).toBe(0);
    expect(typeof body.data.capturedAt).toBe('string');
    expect(new Date(body.data.capturedAt).toISOString()).toBe(body.data.capturedAt);
    expect(prisma.productStock.createMany).not.toHaveBeenCalled();

    await app.close();
  });
});
