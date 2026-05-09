import { AppError } from "@/shared/errors/AppError";
import { OMIE_ENDPOINTS } from "@/shared/integrations/omie/omie.constants";
import { mapProductionOrder } from "@/shared/integrations/omie/OmieProductionOrdersAdapter";

export function createSyncProductionOrdersUseCase(deps: {
  jobLock: {
    runExclusive: <T>(
      key: string,
      ttlMs: number,
      fn: (ctx: { renew: () => Promise<Date>; release: () => Promise<void> }) => Promise<T>
    ) => Promise<{ acquired: true; result: T } | { acquired: false; lockedUntil?: Date }>;
  };
  listProductionOrdersPage: {
    execute: (input: { 
      page: number; 
      pageSize: number;
      filterCompleted?: boolean;
      filterCompletionDateStart?: string;
      filterCompletionDateEnd?: string;
    }) => Promise<{
      resp: { total_de_paginas?: number; cadastros?: any[] };
      resolvedOmieEndpoint: { path: string; call: string };
    }>;
  };
  productionOrdersRepo: {
    upsertOrderWithItems: (order: any, items: any[]) => Promise<void>;
    reconcileMissingOrders: (activeOmieCodes: string[]) => Promise<number>;
  };
  logger?: {
    info: (msg: string, meta?: any) => void;
    warn: (msg: string, meta?: any) => void;
    error: (msg: string, meta?: any) => void;
  };
}) {
  const LOCK_KEY = "omie:production-orders:sync";
  const LOCK_TTL_MS = 5 * 60 * 1000;
  const PAGE_SIZE = 50;

  return {
    async execute(options?: {
      filterCompleted?: boolean;
      filterCompletionDateStart?: string;
      filterCompletionDateEnd?: string;
    }) {
      const lockRun = await deps.jobLock.runExclusive(LOCK_KEY, LOCK_TTL_MS, async ({ renew }) => {
        let page = 1;
        let totalPages = 1;
        let syncedOrders = 0;
        let skippedOrders = 0;
        const activeOmieCodes = new Set<string>();

        try {
          let resolvedOmieEndpoint: { path: string; call: string } | null = null;
          
          do {
            const { resp, resolvedOmieEndpoint: resolved } = await deps.listProductionOrdersPage.execute({
              page,
              pageSize: PAGE_SIZE,
              filterCompleted: options?.filterCompleted,
              filterCompletionDateStart: options?.filterCompletionDateStart,
              filterCompletionDateEnd: options?.filterCompletionDateEnd,
            });

            if (!resolvedOmieEndpoint) resolvedOmieEndpoint = resolved;

            totalPages = Number(resp?.total_de_paginas ?? 1);
            const cadastros: any[] = resp?.cadastros ?? [];

            for (const cadastro of cadastros) {
              const { order, items } = mapProductionOrder(cadastro);
              activeOmieCodes.add(String(order.omieCode));

              const validItems = items.filter(
                (i: any) => i?.omieItemCode && i?.productMeshId
              );

              await deps.productionOrdersRepo.upsertOrderWithItems(order, validItems);
              syncedOrders++;
            }

            await renew();
            page++;
          } while (page <= totalPages);

          const reconciledCount = await deps.productionOrdersRepo.reconcileMissingOrders([...activeOmieCodes]);

          return {
            ok: true,
            reason: "DONE",
            syncedOrders,
            skippedOrders,
            reconciledCount,
            pages: totalPages,
            ...(resolvedOmieEndpoint ? { omieEndpoint: resolvedOmieEndpoint } : {}),
          };
        } catch (err: any) {
          if (err instanceof AppError) throw err;

          throw new AppError("OMIE_PRODUCTION_ORDERS_SYNC_FAILED", 500, "Falha ao sincronizar ordens de produção", {
            message: err?.message,
            stack: err?.stack,
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
          reconciledCount: 0,
          pages: 0,
        };
      }

      return lockRun.result;
    },
  };
}