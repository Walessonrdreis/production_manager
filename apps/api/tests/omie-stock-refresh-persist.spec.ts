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
        upsert: vi.fn(),
      },
      $transaction: vi.fn(async (ops: any[]) => Promise.all(ops)),
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
    (prisma.$transaction as any).mockImplementation(async (ops: any[]) => Promise.all(ops));
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

    (prisma.productStock.upsert as any).mockResolvedValue({ id: 'ok' });

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

    expect(prisma.productStock.upsert).toHaveBeenCalledTimes(2);
    const first = (prisma.productStock.upsert as any).mock.calls[0][0];
    const second = (prisma.productStock.upsert as any).mock.calls[1][0];
    expect(first.where).toEqual({ omieCode: '123' });
    expect(second.where).toEqual({ omieCode: '456' });
    expect(first.create).toMatchObject({ omieCode: '123', stockQuantity: '10', minimumStock: '2' });
    expect(second.create).toMatchObject({ omieCode: '456', stockQuantity: '0', minimumStock: '5' });
    expect(first.create.capturedAt).toBeInstanceOf(Date);
    expect(second.create.capturedAt).toBeInstanceOf(Date);
    expect(second.create.capturedAt.getTime()).toBe(first.create.capturedAt.getTime());

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
    expect(prisma.productStock.upsert).not.toHaveBeenCalled();

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
    expect(prisma.productStock.upsert).not.toHaveBeenCalled();

    await app.close();
  });

  it('dryRun=1 retorna insertedCount sem persistir e sem lock', async () => {
    (omieStockCache.refreshNow as any).mockResolvedValue(undefined);
    (omieStockCache.getSnapshot as any).mockResolvedValue({
      items: {
        '123': { stockQuantity: 10, minimumStock: 2 },
        '456': { stockQuantity: 0, minimumStock: 5 },
      },
    });

    const app = await buildApp();
    await app.ready();

    const response = await app.inject({
      method: 'POST',
      url: '/v1/omie/products/stock/refresh?dryRun=1',
      payload: {},
      headers: { 'content-type': 'application/json' },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.data.insertedCount).toBe(2);
    expect(prisma.productStock.upsert).not.toHaveBeenCalled();
    expect(prisma.syncLock.create).not.toHaveBeenCalled();
    expect(prisma.syncLock.updateMany).not.toHaveBeenCalled();

    await app.close();
  });
});
