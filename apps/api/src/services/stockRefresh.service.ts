import { prisma } from '../db';
import { omieStockCache } from '../integrations/omie/OmieStockCache';

type StockRefreshOptions = { dryRun?: boolean };

type StockRefreshResult = {
  insertedCount: number;
  meta?: Record<string, number>;
};

const STOCK_REFRESH_LOCK_KEY = 'stock_refresh';
const STOCK_REFRESH_LOCK_TTL_MS = 10 * 60 * 1000;

async function acquireStockRefreshLock(): Promise<boolean> {
  const now = new Date();
  const lockedUntil = new Date(now.getTime() + STOCK_REFRESH_LOCK_TTL_MS);

  try {
    await (prisma as any).syncLock.create({
      data: {
        key: STOCK_REFRESH_LOCK_KEY,
        lockedUntil,
      },
    });
    return true;
  } catch (err: any) {
    if (err?.code !== 'P2002') {
      throw err;
    }

    const updated = await (prisma as any).syncLock.updateMany({
      where: {
        key: STOCK_REFRESH_LOCK_KEY,
        lockedUntil: {
          lte: now,
        },
      },
      data: {
        lockedUntil,
      },
    });

    return (updated?.count ?? 0) > 0;
  }
}

async function releaseStockRefreshLock(): Promise<void> {
  const now = new Date();
  await (prisma as any).syncLock.updateMany({
    where: { key: STOCK_REFRESH_LOCK_KEY },
    data: { lockedUntil: now },
  });
}

const toNumber = (value: any): number | null => {
  if (value == null) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const parsed = Number(value.trim().replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (typeof value?.toNumber === 'function') {
    const num = value.toNumber();
    return Number.isFinite(num) ? num : null;
  }
  const asString = typeof value?.toString === 'function' ? value.toString() : String(value);
  const parsed = Number(String(asString).trim().replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeNumberString = (value: unknown): string => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : '0';
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return '0';
    const parsed = Number(trimmed.replace(',', '.'));
    return Number.isFinite(parsed) ? String(parsed) : '0';
  }

  return '0';
};

export async function runStockRefresh(options?: StockRefreshOptions): Promise<StockRefreshResult> {
  const dryRun = Boolean(options?.dryRun);
  let lockAcquired = false;

  if (!dryRun) {
    lockAcquired = await acquireStockRefreshLock();
    if (!lockAcquired) {
      console.warn('stock refresh skipped: lock is active');
      return {
        insertedCount: 0,
        meta: { skippedLocked: 1 },
      };
    }
  }

  try {
    await omieStockCache.refreshNow();
    const capturedAt = new Date();
    const snapshot = await omieStockCache.getSnapshot();

    const snapshotMap = new Map<string, any>();
    const maybeSnapshot: any = snapshot as any;
    const items = maybeSnapshot?.items ?? maybeSnapshot;

    if (items instanceof Map) {
      for (const [k, v] of items.entries()) snapshotMap.set(String(k).trim(), v);
    } else if (items && typeof items.entries === 'function') {
      const entries = Array.from((items as any).entries()) as Array<[unknown, unknown]>;
      for (const [k, v] of entries) snapshotMap.set(String(k).trim(), v);
    } else if (items && typeof items === 'object') {
      for (const [k, v] of Object.entries(items)) snapshotMap.set(String(k).trim(), v);
    }

    const EXPECTED_OMIE_CODE_LENGTH = 32;
    const MAX_DECIMAL_INTEGER_DIGITS = 14;
    const BATCH_SIZE = 1000;
    const MAX_WARN_LOGS = 10;

    let outsideExpectedOmieCodeLength = 0;
    let skippedOutOfRangeDecimal = 0;

    const rows = Array.from(snapshotMap.entries())
      .map(([omieCode, entry]) => {
        const code = String(omieCode).trim();

        if (code.length > EXPECTED_OMIE_CODE_LENGTH) {
          outsideExpectedOmieCodeLength += 1;
          if (outsideExpectedOmieCodeLength <= MAX_WARN_LOGS) {
            console.warn('omieCode outside expected size', { omieCode: code, length: code.length });
          }
        }

        const stockQuantity = normalizeNumberString(entry?.stockQuantity);
        const minimumStock = normalizeNumberString(entry?.minimumStock);

        return {
          omieCode: code,
          stockQuantity,
          minimumStock,
          capturedAt,
        };
      })
      .filter((row) => {
        if (!row.omieCode) return false;

        const qty = toNumber(row.stockQuantity);
        const min = toNumber(row.minimumStock);

        const qtyIntDigits = qty == null ? 0 : Math.trunc(Math.abs(qty)).toString().replace('-', '').length;
        const minIntDigits = min == null ? 0 : Math.trunc(Math.abs(min)).toString().replace('-', '').length;

        if (qtyIntDigits > MAX_DECIMAL_INTEGER_DIGITS || minIntDigits > MAX_DECIMAL_INTEGER_DIGITS) {
          skippedOutOfRangeDecimal += 1;
          return false;
        }

        return true;
      });

    if (dryRun) {
      const meta: Record<string, number> = {};
      if (outsideExpectedOmieCodeLength > 0) meta.outsideExpectedOmieCodeLength = outsideExpectedOmieCodeLength;
      if (skippedOutOfRangeDecimal > 0) meta.skippedOutOfRangeDecimal = skippedOutOfRangeDecimal;

      return {
        insertedCount: rows.length,
        meta: Object.keys(meta).length > 0 ? meta : undefined,
      };
    }

    let insertedCount = 0;

    if (rows.length > 0) {
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);
        const result = await (prisma as any).productStock.createMany({
          data: batch,
        });
        insertedCount += result?.count ?? 0;
      }
    }

    const meta: Record<string, number> = {};
    if (outsideExpectedOmieCodeLength > 0) meta.outsideExpectedOmieCodeLength = outsideExpectedOmieCodeLength;
    if (skippedOutOfRangeDecimal > 0) meta.skippedOutOfRangeDecimal = skippedOutOfRangeDecimal;

    return {
      insertedCount,
      meta: Object.keys(meta).length > 0 ? meta : undefined,
    };
  } finally {
    if (lockAcquired) {
      try {
        await releaseStockRefreshLock();
      } catch (err: any) {
        console.warn('stock refresh: failed to release lock', { message: err?.message });
      }
    }
  }
}
