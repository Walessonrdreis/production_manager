import { describe, it, expect, vi, beforeEach } from 'vitest';

type StockRow = {
  omieCode: string;
  stockQuantity: string;
  minimumStock: string;
  capturedAt: Date;
  updatedAt: Date;
};

const store = new Map<string, StockRow>();

vi.mock('../src/integrations/omie/OmieStockCache', () => {
  return {
    omieStockCache: {
      refreshNow: vi.fn(),
      getSnapshot: vi.fn(),
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

import { prisma } from '../src/db';
import { omieStockCache } from '../src/integrations/omie/OmieStockCache';
import { runStockRefresh } from '../src/services/stockRefresh.service';

describe('runStockRefresh - idempotente por omieCode', () => {
  beforeEach(() => {
    store.clear();
    vi.resetAllMocks();

    (omieStockCache.refreshNow as any).mockResolvedValue(undefined);
    (omieStockCache.getSnapshot as any).mockResolvedValue({
      items: {
        XTE: { stockQuantity: 10, minimumStock: 2 },
      },
    });

    (prisma.syncLock.create as any).mockResolvedValueOnce({
      key: 'stock_refresh',
      lockedUntil: new Date('2099-01-01T00:00:00.000Z'),
    });

    (prisma.syncLock.create as any).mockRejectedValueOnce({ code: 'P2002' });
    (prisma.syncLock.updateMany as any).mockResolvedValue({ count: 1 });

    (prisma.productStock.upsert as any).mockImplementation(async ({ where, create, update }: any) => {
      const code = where.omieCode as string;
      const existing = store.get(code);

      const next: StockRow = existing
        ? {
            ...existing,
            stockQuantity: update.stockQuantity,
            minimumStock: update.minimumStock,
            capturedAt: update.capturedAt,
            updatedAt: update.updatedAt,
          }
        : {
            omieCode: create.omieCode,
            stockQuantity: create.stockQuantity,
            minimumStock: create.minimumStock,
            capturedAt: create.capturedAt,
            updatedAt: create.capturedAt,
          };

      store.set(code, next);
      return next;
    });
  });

  it('executar duas vezes mantém 1 linha e atualiza quantity', async () => {
    const first = await runStockRefresh();
    expect(first.insertedCount).toBe(1);
    expect(store.size).toBe(1);
    expect(store.get('XTE')?.stockQuantity).toBe('10');

    (omieStockCache.getSnapshot as any).mockResolvedValueOnce({
      items: {
        XTE: { stockQuantity: 11, minimumStock: 2 },
      },
    });

    const second = await runStockRefresh();
    expect(second.insertedCount).toBe(1);
    expect(store.size).toBe(1);
    expect(store.get('XTE')?.stockQuantity).toBe('11');

    expect(prisma.productStock.upsert).toHaveBeenCalledTimes(2);
    expect((prisma.productStock.upsert as any).mock.calls[0][0].where).toEqual({ omieCode: 'XTE' });
    expect((prisma.productStock.upsert as any).mock.calls[1][0].where).toEqual({ omieCode: 'XTE' });
  });
});

