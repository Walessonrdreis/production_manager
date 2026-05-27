import { AppError } from "@/shared/errors/AppError";
import { isEligibleStage20, mapOrder } from "@/shared/integrations/omie";
import { backfillOrderClientNames } from "@/modules/legacy/omie-sales-orders/application/use-cases/backfill-order-client-names.usecase";

/**
 * Mitigação pragmática (sem refatorar arquitetura):
 * - Flag de ambiente para ligar/desligar sync via infra
 * - Cooldown em memória para evitar "sync em rajada"
 * - Lock distribuído para exclusividade
 * - ✅ Pós-sync automatiza:
 *    - sync-missing-clients (se injetado)
 *    - backfill de client names (DB-only)
 *
 * Observação:
 * - Em ambiente multi-instância, o cooldown é por instância
 * - O lock é o mecanismo final de proteção
 */

// ✅ cooldown em memória
let lastSyncStartedAt: number | null = null;

// recomendado para Render / Omie (evita rajada pós-deploy / wake)
const STARTUP_SYNC_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutos

type LoggerLike = {
  info?: (obj: any, msg?: string) => void;
  warn?: (obj: any, msg?: string) => void;
  error?: (obj: any, msg?: string) => void;
};

export function createSyncStage20OrdersUseCase(deps: {
  jobLock: {
    runExclusive: <T>(
      key: string,
      ttlMs: number,
      fn: (ctx: { renew: () => Promise<Date>; release: () => Promise<void> }) => Promise<T>
    ) => Promise<
      | { acquired: true; result: T }
      | { acquired: false; lockedUntil?: Date }
    >;
  };
  listOmieOrdersPage: {
    execute: (input: { page: number; pageSize: number }) => Promise<{
      resp: { total_de_paginas?: number; pedido_venda_produto?: any[] };
      resolvedOmieEndpoint: { path: string; call: string };
    }>;
  };
  omieOrdersRepo: {
    upsertOrderWithItems: (order: any, items: any[]) => Promise<void>;
    reconcileMissingStage20Orders: (activeOmieCodes: string[]) => Promise<number>;
  };

  /**
   * ✅ Injeção opcional (criada no módulo index.ts quando app.clientRepository/app.omieClientGateway existem)
   */
  syncMissingClients?: {
    execute: () => Promise<{ ok: boolean; checked: number; synced: number }>;
  };

  /**
   * ✅ Logger opcional (se você quiser passar app.log do módulo)
   * Se não passar, os logs só não aparecem — mas o fluxo funciona igual.
   */
  logger?: LoggerLike;
}) {
  const LOCK_KEY = "omie:orders:stage20:sync";
  const LOCK_TTL_MS = 30 * 60 * 1000; // 30 minutos
  const PAGE_SIZE = 50;

  const log = deps.logger ?? {};

  return {
    async execute() {
      const syncId = `stage20-${Date.now()}`;

      /**
       * ✅ FREIO 0 — FLAG DE AMBIENTE
       * Se estiver false, NADA toca Omie.
       */
      if (process.env.OMIE_STAGE20_SYNC_ENABLED === "false") {
        log.info?.({ syncId, reason: "DISABLED_BY_ENV" }, "[STAGE20] sync bloqueado por env");
        return {
          ok: true,
          reason: "DISABLED_BY_ENV",
          syncedOrders: 0,
          skippedOrders: 0,
          pages: 0,
        };
      }

      /**
       * ✅ FREIO 1 — COOLDOWN EM MEMÓRIA
       */
      const now = Date.now();
      if (lastSyncStartedAt && now - lastSyncStartedAt < STARTUP_SYNC_COOLDOWN_MS) {
        const nextAllowedAt = new Date(lastSyncStartedAt + STARTUP_SYNC_COOLDOWN_MS).toISOString();
        log.warn?.(
          { syncId, reason: "COOLDOWN", cooldownMs: STARTUP_SYNC_COOLDOWN_MS, nextAllowedAt },
          "[STAGE20] sync bloqueado por cooldown"
        );
        return {
          ok: true,
          reason: "COOLDOWN",
          cooldownMs: STARTUP_SYNC_COOLDOWN_MS,
          nextAllowedAt,
          syncedOrders: 0,
          skippedOrders: 0,
          pages: 0,
        };
      }

      lastSyncStartedAt = now;

      log.info?.({ syncId, lockKey: LOCK_KEY }, "[STAGE20] sync iniciado");

      /**
       * ✅ FREIO 2 — LOCK DISTRIBUÍDO
       */
      const lockRun = await deps.jobLock.runExclusive(
        LOCK_KEY,
        LOCK_TTL_MS,
        async ({ renew }) => {
          let page = 1;
          let totalPages = 1;
          let syncedOrders = 0;
          let skippedOrders = 0;
          let resolvedOmieEndpoint: { path: string; call: string } | null = null;

          const activeStage20OmieCodes = new Set<string>();

          // métricas pós-sync
          let missingClientsResult: { ok: boolean; checked: number; synced: number } | null = null;
          let backfillResult: any = null;

          try {
            do {
              const t0 = Date.now();

              const { resp, resolvedOmieEndpoint: resolved } =
                await deps.listOmieOrdersPage.execute({
                  page,
                  pageSize: PAGE_SIZE,
                });

              if (!resolvedOmieEndpoint) resolvedOmieEndpoint = resolved;

              totalPages = Number(resp?.total_de_paginas ?? 1);
              const pedidos: any[] = resp?.pedido_venda_produto ?? [];

              for (const pedido of pedidos) {
                if (!isEligibleStage20(pedido)) {
                  skippedOrders++;
                  continue;
                }

                const { order, items } = mapOrder(pedido);
                activeStage20OmieCodes.add(String(order.omieCode));

                const validItems = items.filter(
                  (i: any) =>
                    i?.omieItemCode &&
                    i?.description &&
                    String(i.description).trim().length > 0
                );

                await deps.omieOrdersRepo.upsertOrderWithItems(order, validItems);
                syncedOrders++;
              }

              await renew();

              const durationMs = Date.now() - t0;

              log.info?.(
                {
                  syncId,
                  page,
                  totalPages,
                  fetched: pedidos.length,
                  syncedOrdersSoFar: syncedOrders,
                  skippedOrdersSoFar: skippedOrders,
                  durationMs,
                },
                "[STAGE20] página processada"
              );

              page++;
            } while (page <= totalPages);

            // reconcile final
            await deps.omieOrdersRepo.reconcileMissingStage20Orders([
              ...activeStage20OmieCodes,
            ]);

            log.info?.(
              { syncId, activeOrdersStage20: activeStage20OmieCodes.size },
              "[STAGE20] reconcile executado"
            );

            // ✅ AUTOMATIZAÇÃO 1 — sync missing clients (se disponível)
            if (deps.syncMissingClients) {
              missingClientsResult = await deps.syncMissingClients.execute();
              log.info?.(
                {
                  syncId,
                  checked: missingClientsResult.checked,
                  synced: missingClientsResult.synced,
                  ok: missingClientsResult.ok,
                },
                "[CLIENTS] sync-missing-clients executado"
              );
            } else {
              log.warn?.(
                { syncId, reason: "SYNC_MISSING_CLIENTS_NOT_CONFIGURED" },
                "[CLIENTS] sync-missing-clients não configurado (deps ausentes)"
              );
            }

            // ✅ AUTOMATIZAÇÃO 2 — backfill client names (DB-only)
            backfillResult = await backfillOrderClientNames();

            log.info?.(
              {
                syncId,
                updated: backfillResult?.updated ?? null,
                scanned: backfillResult?.scanned ?? null,
              },
              "[ORDERS] backfill client names executado"
            );

            log.info?.(
              {
                syncId,
                syncedOrders,
                skippedOrders,
                pages: totalPages,
                omieEndpoint: resolvedOmieEndpoint ?? undefined,
              },
              "[STAGE20] sync finalizado com sucesso"
            );

            return {
              ok: true,
              reason: "DONE",
              syncedOrders,
              skippedOrders,
              pages: totalPages,
              ...(resolvedOmieEndpoint ? { omieEndpoint: resolvedOmieEndpoint } : {}),
              ...(missingClientsResult ? { missingClientsResult } : {}),
              ...(backfillResult ? { backfillResult } : {}),
            };
          } catch (err: any) {
            log.error?.(
              { syncId, error: err?.message, stack: err?.stack },
              "[STAGE20] erro durante sync"
            );

            if (err instanceof AppError) throw err;

            throw new AppError(
              "OMIE_STAGE20_ORDERS_SYNC_FAILED",
              500,
              "Falha ao sincronizar pedidos etapa 20",
              {
                message: err?.message,
                syncId,
              }
            );
          }
        }
      );

      if (!lockRun.acquired) {
        log.warn?.(
          { syncId, reason: "LOCKED", lockedUntil: lockRun.lockedUntil ?? null },
          "[STAGE20] sync bloqueado por lock"
        );

        return {
          ok: true,
          reason: "LOCKED",
          lockedUntil: lockRun.lockedUntil,
          syncedOrders: 0,
          skippedOrders: 0,
          pages: 0,
        };
      }

      return lockRun.result;
    },
  };
}