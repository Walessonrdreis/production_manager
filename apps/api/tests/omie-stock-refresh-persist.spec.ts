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
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-14T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('persiste um snapshot no product_stock e retorna insertedCount e capturedAt', async () => {
    (omieStockCache.refreshNow as any).mockResolvedValue(undefined);
    (omieStockCache.getLastUpdatedAt as any).mockReturnValue('2026-04-14T12:00:00.000Z');
    (omieStockCache.getSnapshot as any).mockResolvedValue(
      new Map([
        ['111', { stockQuantity: '10', minimumStock: '2' }],
        ['222', { stockQuantity: '0', minimumStock: '0' }],
      ])
    );

    (prisma.productStock.createMany as any).mockResolvedValue({ count: 2 });

    const app = await buildApp();
    await app.ready();

    const response = await app.inject({
      method: 'POST',
      url: '/v1/omie/products/stock/refresh',
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');

    const body = JSON.parse(response.payload);
    expect(body.insertedCount).toBe(2);
    expect(body.capturedAt).toBe('2026-04-14T12:00:00.000Z');
    expect(body.stockCacheUpdatedAt).toBe('2026-04-14T12:00:00.000Z');

    expect(prisma.productStock.createMany).toHaveBeenCalledTimes(1);
    const args = (prisma.productStock.createMany as any).mock.calls[0][0];
    expect(args.data).toEqual([
      {
        omieCode: '111',
        stockQuantity: '10',
        minimumStock: '2',
        capturedAt: new Date('2026-04-14T12:00:00.000Z'),
      },
      {
        omieCode: '222',
        stockQuantity: '0',
        minimumStock: '0',
        capturedAt: new Date('2026-04-14T12:00:00.000Z'),
      },
    ]);

    await app.close();
  });
});

