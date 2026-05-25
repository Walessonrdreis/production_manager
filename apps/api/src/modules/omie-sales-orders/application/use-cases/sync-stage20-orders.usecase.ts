import { AppError } from "@/shared/errors/AppError";
import { isEligibleStage20, mapOrder } from "@/shared/integrations/omie";

/**
 * Mitigação pragmática (sem refatorar arquitetura):
 * - Cooldown em memória para evitar "sync em rajada" no startup/re-render.
 * - Mantém contrato e lock atual intactos.
 *
 * Observação: Em ambiente multi-instância, isso reduz mas não elimina 100% (o lock cobre concorrência).
 */

// ✅ cooldown em memória (mínima mudança, grande impacto)
let lastSyncStartedAt: number | null = null;
// ajuste fino: 60–180s costuma ser suficiente para evitar REDUNDANT pós-start
const STARTUP_SYNC_COOLDOWN_MS = 90 * 1000;

export function createSyncStage20OrdersUseCase(deps: {
  jobLock: {
    runExclusive: <T>(
      key: string,
      ttlMs: number,
      fn: (ctx: { renew: () => Promise<Date>; release: () => Promise<void> }) => Promise<T>
    ) => Promise<{ acquired: true; result: T } | { acquired: false; lockedUntil?: Date }>;
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
  const LOCK_TTL_MS = 5 * 60 * 1000;
  const PAGE_SIZE = 50;

  return {
    async execute() {
      // ✅ Freio 1: cooldown em memória (evita rajada em re-render/startup)
      const now = Date.now();
      if (lastSyncStartedAt && now - lastSyncStartedAt < STARTUP_SYNC_COOLDOWN_MS) {
        return {
          ok: true,
          reason: "COOLDOWN",
          cooldownMs: STARTUP_SYNC_COOLDOWN_MS,
          nextAllowedAt: new Date(lastSyncStartedAt + STARTUP_SYNC_COOLDOWN_MS).toISOString(),
          syncedOrders: 0,
          skippedOrders: 0,
          pages: 0,
        };
      }
      lastSyncStartedAt = now;

      const lockRun = await deps.jobLock.runExclusive(LOCK_KEY, LOCK_TTL_MS, async ({ renew }) => {
        let page = 1;
        let totalPages = 1;
        let syncedOrders = 0;
        let skippedOrders = 0;
        let resolvedOmieEndpoint: { path: string; call: string } | null = null;
        const activeStage20OmieCodes = new Set<string>();

        try {
          do {
            const { resp, resolvedOmieEndpoint: resolved } = await deps.listOmieOrdersPage.execute({
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

          await deps.omieOrdersRepo.reconcileMissingStage20Orders([...activeStage20OmieCodes]);

          return {
            ok: true,
            reason: "DONE",
            syncedOrders,
            skippedOrders,
            pages: totalPages,
            ...(resolvedOmieEndpoint ? { omieEndpoint: resolvedOmieEndpoint } : {}),
          };
        } catch (err: any) {
          if (err instanceof AppError) throw err;

          throw new AppError("OMIE_STAGE20_ORDERS_SYNC_FAILED", 500, "Falha ao sincronizar pedidos etapa 20", {
            message: err?.message,
          });
        }
      });

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