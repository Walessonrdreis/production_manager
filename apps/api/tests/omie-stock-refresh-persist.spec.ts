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
      syncLock: {
        create: vi.fn(),
        updateMany: vi.fn(),
      },
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
    (prisma.syncLock.create as any).mockResolvedValue({
      key: 'stock_refresh',
      lockedUntil: new Date('2099-01-01T00:00:00.000Z'),
    });
    (prisma.syncLock.updateMany as any).mockResolvedValue({ count: 1 });
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

  it('quando lock está ativo retorna skippedLocked=1 e não executa refresh', async () => {
    (prisma.syncLock.create as any).mockRejectedValue({ code: 'P2002' });
    (prisma.syncLock.updateMany as any).mockResolvedValueOnce({ count: 0 });

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
    expect(body.meta).toMatchObject({ skippedLocked: 1 });
    expect(omieStockCache.refreshNow).not.toHaveBeenCalled();
    expect(prisma.productStock.createMany).not.toHaveBeenCalled();

    await app.close();
  });
});
