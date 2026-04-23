import { AppError } from "@/shared/errors/AppError";

const OMIE_PRODUCTS_MAX_PAGES = 2000;

export function createSyncOmieProductsUseCase(deps: {
  prisma: any;
  syncLockRepo: {
    tryAcquire: (nowMs: number, ttlMs: number) => Promise<boolean>;
    release: () => Promise<void>;
    isTableUnavailableError: (err: any) => boolean;
  };
  fetchOmieProductsPage: {
    pageSize: number;
    execute: (input: { page: number; requestId: string }) => Promise<{ items: any[]; totalPages: number | null }>;
  };
  omieProductRepo: { upsertFromOmieItem: (item: any) => Promise<any> };
  logger?: { info?: any; warn?: any; error?: any };
  state: { lastGlobalSyncAt: number; inMemoryLockUntil: number };
  throttleWindowMs?: number;
  lockWindowMs?: number;
}) {
  const log = deps.logger ?? {};
  const THROTTLE_WINDOW_MS = deps.throttleWindowMs ?? 60 * 1000;
  const LOCK_WINDOW_MS = deps.lockWindowMs ?? 2 * 60 * 1000;

  function acquireInMemoryLock(now: number) {
    if (deps.state.inMemoryLockUntil > now) {
      throw new AppError("SYNC_IN_PROGRESS", 409, "Sincronização já em andamento");
    }
    deps.state.inMemoryLockUntil = now + LOCK_WINDOW_MS;
  }

  function releaseInMemoryLock() {
    deps.state.inMemoryLockUntil = 0;
  }

  return {
    async execute(input: { requestId: string; force?: boolean }) {
      const requestId = input.requestId;
      const force = input.force === true;

      const now = Date.now();
      const timeSinceLastSync = now - deps.state.lastGlobalSyncAt;

      if (!force && timeSinceLastSync < THROTTLE_WINDOW_MS) {
        const nextAllowedInSec = Math.ceil((THROTTLE_WINDOW_MS - timeSinceLastSync) / 1000);
        log.info?.({ requestId, nextAllowedInSec }, "sync skipped (throttled)");
        return { skipped: true, reason: "SYNC_THROTTLED", nextAllowedInSec };
      }

      let lockAcquired = false;
      let usingInMemoryLock = false;

      try {
        await deps.syncLockRepo.tryAcquire(now, LOCK_WINDOW_MS);
        lockAcquired = true;
      } catch (dbError: any) {
        if (dbError instanceof AppError) throw dbError;

        if (deps.syncLockRepo.isTableUnavailableError(dbError)) {
          acquireInMemoryLock(now);
          usingInMemoryLock = true;
          lockAcquired = true;
          log.warn?.({ requestId, strategy: "in_memory", prismaCode: dbError?.code }, "sync lock fallback");
        } else {
          throw new AppError("SYNC_LOCK_DB_ERROR", 503, "Falha ao acessar o lock de sincronização no banco", {
            prismaCode: dbError?.code,
            message: dbError?.message,
          });
        }
      }

      const startTime = Date.now();
      let upsertedCount = 0;
      let failedCount = 0;
      let pagesProcessed = 0;

      try {
        let page = 1;
        let totalPages: number | null = null;

        while (true) {
          if (page > OMIE_PRODUCTS_MAX_PAGES) {
            throw new AppError("OMIE_PAGINATION_OVERFLOW", 502, "Paginação do Omie excedeu o limite de segurança", {
              page,
              requestId,
            });
          }

          const { items, totalPages: reportedTotalPages } = await deps.fetchOmieProductsPage.execute({ page, requestId });

          if (reportedTotalPages && totalPages === null) totalPages = reportedTotalPages;
          if (items.length === 0) break;

          for (const item of items) {
            try {
              await deps.omieProductRepo.upsertFromOmieItem(item);
              upsertedCount++;
            } catch (err: any) {
              failedCount++;
              log.error?.({ requestId, err: err?.message }, "sync item failed");
            }
          }

          pagesProcessed++;

          if (totalPages) {
            if (page >= totalPages) break;
          } else {
            if (items.length < deps.fetchOmieProductsPage.pageSize) break;
          }

          page++;
        }

        deps.state.lastGlobalSyncAt = Date.now();

        log.info?.(
          { requestId, upserted: upsertedCount, failed: failedCount, pages: pagesProcessed, durationMs: Date.now() - startTime },
          "omie products sync end"
        );

        return { upserted: upsertedCount, failed: failedCount };
      } finally {
        if (lockAcquired) {
          if (usingInMemoryLock) {
            releaseInMemoryLock();
          } else {
            try {
              await deps.syncLockRepo.release();
            } catch (releaseErr: any) {
              log.error?.({ requestId, err: releaseErr?.message }, "failed to release sync lock");
            }
          }
        }
      }
    },
  };
}