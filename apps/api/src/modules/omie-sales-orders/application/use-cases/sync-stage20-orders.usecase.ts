import { AppError } from "@/shared/errors/AppError";
import { isEligibleStage20, mapOrder } from "@/shared/integrations/omie";

/**
 * Mitigação pragmática (sem refatorar arquitetura):
 * - Flag de ambiente para ligar/desligar sync via infra (Render)
 * - Cooldown em memória para evitar "sync em rajada" no startup/re-render
 * - Mantém contrato, lock e comportamento atual intactos
 *
 * Observação:
 * - Em ambiente multi-instância, o cooldown é por instância
 * - O lock continua sendo o mecanismo final de proteção
 */

// ✅ cooldown em memória (mínima mudança, grande impacto)
let lastSyncStartedAt: number | null = null;

// recomendado para Render / Omie (evita rajada pós-deploy / wake)
const STARTUP_SYNC_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutos

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
}) {
  const LOCK_KEY = "omie:orders:stage20:sync";
  const LOCK_TTL_MS = 30 * 60 * 1000; // 30 minutos
  const PAGE_SIZE = 50;

  return {
    async execute() {
      /**
       * ✅ FREIO 0 — FLAG DE AMBIENTE (controle via Render)
       * Se estiver false, NADA toca Omie.
       */
      if (process.env.OMIE_STAGE20_SYNC_ENABLED === "false") {
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
       * Evita múltiplos syncs em sequência no startup / re-render
       */
      const now = Date.now();
      if (lastSyncStartedAt && now - lastSyncStartedAt < STARTUP_SYNC_COOLDOWN_MS) {
        return {
          ok: true,
          reason: "COOLDOWN",
          cooldownMs: STARTUP_SYNC_COOLDOWN_MS,
          nextAllowedAt: new Date(
            lastSyncStartedAt + STARTUP_SYNC_COOLDOWN_MS
          ).toISOString(),
          syncedOrders: 0,
          skippedOrders: 0,
          pages: 0,
        };
      }

      lastSyncStartedAt = now;

      /**
       * ✅ FREIO 2 — LOCK DISTRIBUÍDO
       * Garante exclusividade entre instâncias
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

          try {
            do {
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
              page++;
            } while (page <= totalPages);

            await deps.omieOrdersRepo.reconcileMissingStage20Orders([
              ...activeStage20OmieCodes,
            ]);

            return {
              ok: true,
              reason: "DONE",
              syncedOrders,
              skippedOrders,
              pages: totalPages,
              ...(resolvedOmieEndpoint
                ? { omieEndpoint: resolvedOmieEndpoint }
                : {}),
            };
          } catch (err: any) {
            if (err instanceof AppError) throw err;

            throw new AppError(
              "OMIE_STAGE20_ORDERS_SYNC_FAILED",
              500,
              "Falha ao sincronizar pedidos etapa 20",
              {
                message: err?.message,
              }
            );
          }
        }
      );

      if (!lockRun.acquired) {
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