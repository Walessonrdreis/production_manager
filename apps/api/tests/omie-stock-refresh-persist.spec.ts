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
      omieProduct: {
        findMany: vi.fn(),
      },
      stockRefresh: {
        create: vi.fn(),
        update: vi.fn(),
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
  });

  it('persiste um snapshot no product_stock para todos os itens do catálogo (merge) e retorna contadores', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-14T12:00:00.000Z'));

    (omieStockCache.refreshNow as any).mockResolvedValue(undefined);
    (omieStockCache.getSnapshot as any).mockResolvedValue(
      {
        items: {
          '111': { stockQuantity: 10, minimumStock: 2 },
          '333': { stockQuantity: -2.5, minimumStock: -1 },
        },
      }
    );

    (prisma.omieProduct.findMany as any).mockResolvedValue([
      { omieCode: '111', omieId: '111', rawPayload: { codigo: '111' } },
      { omieCode: '222', omieId: '222', rawPayload: { codigo: '222' } },
      { omieCode: '333', omieId: '333', rawPayload: { codigo: '333' } },
    ]);

    (prisma.stockRefresh.create as any).mockResolvedValue({ id: 'refresh-id' });
    (prisma.stockRefresh.update as any).mockResolvedValue({ id: 'refresh-id' });
    (prisma.productStock.createMany as any).mockResolvedValue({ count: 3 });

    const app = await buildApp();
    await app.ready();

    const response = await app.inject({
      method: 'POST',
      url: '/v1/omie/products/stock/refresh',
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');

    const body = JSON.parse(response.payload);
    expect(body.data.totalItems).toBe(3);
    expect(body.data.reportedItems).toBe(2);
    expect(body.data.missingItems).toBe(1);
    expect(body.data.insertedCount).toBe(3);
    expect(body.data.capturedAt).toBe('2026-04-14T12:00:00.000Z');
    expect(typeof body.data.refreshId).toBe('string');

    expect(prisma.productStock.createMany).toHaveBeenCalledTimes(1);
    const args = (prisma.productStock.createMany as any).mock.calls[0][0];
    expect(args.data).toHaveLength(3);

    const byCode = new Map(args.data.map((row: any) => [row.omieCode, row]));

    expect(byCode.get('111')).toMatchObject({
      omieCode: '111',
      reported: true,
      rawStockQuantity: '10',
      rawMinimumStock: '2',
      capturedAt: new Date('2026-04-14T12:00:00.000Z'),
    });

    expect(byCode.get('222')).toMatchObject({
      omieCode: '222',
      reported: false,
      rawStockQuantity: null,
      rawMinimumStock: null,
      capturedAt: new Date('2026-04-14T12:00:00.000Z'),
    });

    expect(byCode.get('333')).toMatchObject({
      omieCode: '333',
      reported: true,
      rawStockQuantity: '-2.5',
      rawMinimumStock: '-1',
      capturedAt: new Date('2026-04-14T12:00:00.000Z'),
    });

    await app.close();
    vi.useRealTimers();
  });

  it('aceita body JSON vazio {} sem falhar', async () => {
    (omieStockCache.refreshNow as any).mockResolvedValue(undefined);
    (omieStockCache.getSnapshot as any).mockResolvedValue({ items: {} });

    (prisma.omieProduct.findMany as any).mockResolvedValue([
      { omieCode: '111', omieId: '111', rawPayload: { codigo: '111' } },
    ]);

    (prisma.stockRefresh.create as any).mockResolvedValue({ id: 'refresh-id' });
    (prisma.stockRefresh.update as any).mockResolvedValue({ id: 'refresh-id' });
    (prisma.productStock.createMany as any).mockResolvedValue({ count: 1 });

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
    expect(body).toHaveProperty('data');
    expect(body.data).toHaveProperty('refreshId');

    await app.close();
  });

  it('snapshot vazio ainda persiste uma linha por item do catálogo (reported=false, raws NULL)', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-14T12:00:00.000Z'));

    (omieStockCache.refreshNow as any).mockResolvedValue(undefined);
    (omieStockCache.getSnapshot as any).mockResolvedValue({ items: {} });

    (prisma.omieProduct.findMany as any).mockResolvedValue([
      { omieCode: '111', omieId: '111', rawPayload: { codigo: '111' } },
      { omieCode: '222', omieId: '222', rawPayload: { codigo: '222' } },
    ]);

    (prisma.stockRefresh.create as any).mockResolvedValue({ id: 'refresh-id' });
    (prisma.stockRefresh.update as any).mockResolvedValue({ id: 'refresh-id' });
    (prisma.productStock.createMany as any).mockResolvedValue({ count: 2 });

    const app = await buildApp();
    await app.ready();

    const response = await app.inject({
      method: 'POST',
      url: '/v1/omie/products/stock/refresh',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.data.totalItems).toBe(2);
    expect(body.data.reportedItems).toBe(0);
    expect(body.data.missingItems).toBe(2);
    expect(body.data.insertedCount).toBe(2);
    expect(body.data.capturedAt).toBe('2026-04-14T12:00:00.000Z');

    expect(prisma.productStock.createMany).toHaveBeenCalledTimes(1);
    const args = (prisma.productStock.createMany as any).mock.calls[0][0];
    const byCode = new Map(args.data.map((row: any) => [row.omieCode, row]));
    expect(byCode.get('111').reported).toBe(false);
    expect(byCode.get('111').rawStockQuantity).toBeNull();
    expect(byCode.get('222').reported).toBe(false);
    expect(byCode.get('222').rawStockQuantity).toBeNull();

    await app.close();
    vi.useRealTimers();
  });
});
