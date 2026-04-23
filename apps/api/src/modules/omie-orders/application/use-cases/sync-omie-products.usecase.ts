import { AppError } from "@/shared/errors/AppError";

const OMIE_PRODUCTS_MAX_PAGES = 2000;

type SyncResult = {
  upserted?: number;
  failed?: number;
  skipped?: boolean;
  reason?: string;
  nextAllowedInSec?: number;
};

type LoggerLike = {
  info?: (obj: any, msg?: string) => void;
  warn?: (obj: any, msg?: string) => void;
  error?: (obj: any, msg?: string) => void;
};

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
  logger?: LoggerLike;

  // estado em memória (para throttle + lock fallback)
  state: {
    lastGlobalSyncAt: number;
    inMemoryLockUntil: number;
  };

  // parâmetros
  throttleWindowMs?: number; // default 60s
  lockWindowMs?: number;     // default 2min
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
    async execute(input: { requestId: string; force?: boolean }): Promise<SyncResult> {
      const requestId = input.requestId;
      const force = input.force === true;

      const now = Date.now();
      const timeSinceLastSync = now - deps.state.lastGlobalSyncAt;

      // throttle (mantém igual)
      if (!force && timeSinceLastSync < THROTTLE_WINDOW_MS) {
        const nextAllowedInSec = Math.ceil((THROTTLE_WINDOW_MS - timeSinceLastSync) / 1000);
        log.info?.({ requestId, nextAllowedInSec }, "sync skipped (throttled)");
        return { skipped: true, reason: "SYNC_THROTTLED", nextAllowedInSec };
      }

      let lockAcquired = false;
      let usingInMemoryLock = false;

      // lock DB com fallback
      try {
        await deps.syncLockRepo.tryAcquire(now, LOCK_WINDOW_MS);
        lockAcquired = true;
      } catch (dbError: any) {
        if (dbError instanceof AppError) {
          throw dbError;
        }

        if (deps.syncLockRepo.isTableUnavailableError(dbError)) {
          acquireInMemoryLock(now);
          usingInMemoryLock = true;
          lockAcquired = true;
          log.warn?.(
            { requestId, strategy: "in_memory", prismaCode: dbError?.code ?? "UNKNOWN" },
            "sync lock fallback"
          );
        } else {
          log.error?.({ requestId, prismaCode: dbError?.code, err: dbError }, "sync lock db error");
          throw new AppError("SYNC_LOCK_DB_ERROR", 503, "Falha ao acessar o lock de sincronização no banco", {
            prismaCode: dbError?.code,
            message: dbError?.message,
          });
        }
      }

      const startTime = Date.now();
      log.info?.({ requestId }, "omie products sync start");

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

          if (reportedTotalPages && totalPages === null) {
            totalPages = reportedTotalPages;
          }

          if (items.length === 0) break;

          for (const item of items) {
            let fallbackOmieId: any = "DESCONHECIDO";
            try {
              const result = await deps.omieProductRepo.upsertFromOmieItem(item);
              fallbackOmieId = result?.omieId ?? result?.omieCode ?? fallbackOmieId;
              upsertedCount++;
            } catch (err: any) {
              failedCount++;
              fallbackOmieId =
                fallbackOmieId ||
                item?.codigo_produto ||
                item?.codigo ||
                item?.id ||
                "DESCONHECIDO";

              // mantém padrão de log do seu código (sem quebrar)
              log.error?.(
                {
                  event: "sync_item_failed",
                  requestId,
                  omieId: fallbackOmieId,
                  errorMessage: err?.message,
                },
                "omie product sync item failed"
              );

              // se for erro do repo por omieCode não encontrado, traduz para AppError (igual)
              if (String(err?.message) === "OMIE_CODE_NOT_FOUND") {
                // opcional: se quiser tratar como AppError explícito
              }
            }
          }

          pagesProcessed++;

          if (totalPages) {
            if (page >= totalPages) break;
          } else {
            // fallback: se retorno menor que pageSize, acabou
            if (items.length < deps.fetchOmieProductsPage.pageSize) break;
          }

          page++;
        }

        deps.state.lastGlobalSyncAt = Date.now();

        log.info?.(
          {
            requestId,
            upserted: upsertedCount,
            failed: failedCount,
            pages: pagesProcessed,
            durationMs: Date.now() - startTime,
          },
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
              log.error?.({ requestId, err: releaseErr }, "failed to release sync lock");
            }
          }
        }
      }
    },
  };
}