import { AppError } from "@/shared/errors/AppError";
import type { ProductStockUpsertRow } from "@/modules/products/infrastructure/db/product-stock.repo.prisma";

type StockRefreshOptions = { dryRun?: boolean };

type StockRefreshResult = {
  insertedCount: number;
  meta?: Record<string, number>;
};

type LoggerLike = {
  info?: (obj: any, msg?: string) => void;
  warn?: (obj: any, msg?: string) => void;
  error?: (obj: any, msg?: string) => void;
};

const STOCK_REFRESH_LOCK_KEY = "stock_refresh";
const STOCK_REFRESH_LOCK_TTL_MS = 10 * 60 * 1000;

const EXPECTED_OMIE_CODE_LENGTH = 64;
const MAX_DECIMAL_INTEGER_DIGITS = 14;
const BATCH_SIZE = 200;
const MAX_WARN_LOGS = 10;

function toNumber(value: any): number | null {
  if (value == null) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const parsed = Number(value.trim().replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (typeof value?.toNumber === "function") {
    const num = value.toNumber();
    return Number.isFinite(num) ? num : null;
  }
  const asString = typeof value?.toString === "function" ? value.toString() : String(value);
  const parsed = Number(String(asString).trim().replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeNumberString(value: unknown): string {
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "0";
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return "0";
    const parsed = Number(trimmed.replace(",", "."));
    return Number.isFinite(parsed) ? String(parsed) : "0";
  }

  return "0";
}

function normalizeSnapshotToMap(snapshot: any): Map<string, any> {
  // seu service era bem defensivo; mantenho a robustez
  const snapshotMap = new Map<string, any>();
  const items = snapshot?.items ?? snapshot;

  if (items instanceof Map) {
    for (const [k, v] of items.entries()) snapshotMap.set(String(k).trim(), v);
    return snapshotMap;
  }

  if (items && typeof items.entries === "function") {
    const entries = Array.from(items.entries()) as Array<[unknown, unknown]>;
    for (const [k, v] of entries) snapshotMap.set(String(k).trim(), v);
    return snapshotMap;
  }

  if (items && typeof items === "object") {
    for (const [k, v] of Object.entries(items)) snapshotMap.set(String(k).trim(), v);
  }

  return snapshotMap;
}

export function createRefreshStockUseCase(deps: {
  omieStockCache: {
    refreshNow: () => Promise<Map<string, any>>;
    getSnapshot: () => Promise<Map<string, any>>;
  };
  syncLockLeaseRepo: {
    acquire: (key: string, ttlMs: number) => Promise<boolean>;
    release: (key: string) => Promise<void>;
    isTableUnavailableError?: (err: any) => boolean;
  };
  productStockRepo: {
    upsertBatch: (rows: ProductStockUpsertRow[]) => Promise<void>;
  };
  logger?: LoggerLike;
}) {
  const log = deps.logger ?? {};

  return {
    async execute(options?: StockRefreshOptions): Promise<StockRefreshResult> {
      const dryRun = Boolean(options?.dryRun);
      let lockAcquired = false;

      // 1) lock (só quando não é dryRun)
      if (!dryRun) {
        try {
          lockAcquired = await deps.syncLockLeaseRepo.acquire(
            STOCK_REFRESH_LOCK_KEY,
            STOCK_REFRESH_LOCK_TTL_MS
          );
        } catch (err: any) {
          // se tabela não existir, preferimos falhar explicitamente (já que isso é infra crítica)
          throw new AppError(
            "STOCK_REFRESH_LOCK_ERROR",
            503,
            "Falha ao adquirir lock de refresh de estoque",
            { message: err?.message, code: err?.code }
          );
        }

        if (!lockAcquired) {
          log.warn?.({}, "stock refresh skipped: lock is active");
          return { insertedCount: 0, meta: { skippedLocked: 1 } };
        }
      }

      try {
        // 2) atualiza cache e lê snapshot
        await deps.omieStockCache.refreshNow();
        const capturedAt = new Date();
        const snapshot = await deps.omieStockCache.getSnapshot();
        const snapshotMap = normalizeSnapshotToMap(snapshot);

        let outsideExpectedOmieCodeLength = 0;
        let skippedOutOfRangeDecimal = 0;

        // 3) monta rows + validações
        const rows = Array.from(snapshotMap.entries())
          .map(([omieCode, entry]) => {
            const code = String(omieCode).trim();

            if (code.length > EXPECTED_OMIE_CODE_LENGTH) {
              outsideExpectedOmieCodeLength += 1;
              if (outsideExpectedOmieCodeLength <= MAX_WARN_LOGS) {
                log.warn?.({ omieCode: code, length: code.length }, "omieCode outside expected size");
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

            const qtyIntDigits = qty == null ? 0 : Math.trunc(Math.abs(qty)).toString().replace("-", "").length;
            const minIntDigits = min == null ? 0 : Math.trunc(Math.abs(min)).toString().replace("-", "").length;

            if (qtyIntDigits > MAX_DECIMAL_INTEGER_DIGITS || minIntDigits > MAX_DECIMAL_INTEGER_DIGITS) {
              skippedOutOfRangeDecimal += 1;
              return false;
            }

            return true;
          });

        // 4) dryRun retorna sem persistir
        if (dryRun) {
          const meta: Record<string, number> = {};
          if (outsideExpectedOmieCodeLength > 0) meta.outsideExpectedOmieCodeLength = outsideExpectedOmieCodeLength;
          if (skippedOutOfRangeDecimal > 0) meta.skippedOutOfRangeDecimal = skippedOutOfRangeDecimal;

          return {
            insertedCount: rows.length,
            meta: Object.keys(meta).length ? meta : undefined,
          };
        }

        // 5) persistência em batches
        let insertedCount = 0;

        for (let i = 0; i < rows.length; i += BATCH_SIZE) {
          const batch = rows.slice(i, i + BATCH_SIZE);
          await deps.productStockRepo.upsertBatch(batch);
          insertedCount += batch.length;
        }

        const meta: Record<string, number> = {};
        if (outsideExpectedOmieCodeLength > 0) meta.outsideExpectedOmieCodeLength = outsideExpectedOmieCodeLength;
        if (skippedOutOfRangeDecimal > 0) meta.skippedOutOfRangeDecimal = skippedOutOfRangeDecimal;

        return {
          insertedCount,
          meta: Object.keys(meta).length ? meta : undefined,
        };
      } finally {
        // 6) release lock
        if (lockAcquired) {
          try {
            await deps.syncLockLeaseRepo.release(STOCK_REFRESH_LOCK_KEY);
          } catch (err: any) {
            log.warn?.({ message: err?.message }, "stock refresh: failed to release lock");
          }
        }
      }
    },
  };
}