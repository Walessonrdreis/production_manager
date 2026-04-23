import { OmieAdapter } from "@/shared/integrations/omie/omie.adapter";
import type { OmieClient } from "@/shared/integrations/omie/omie.client";

export type OmieStockEntry = {
  stockQuantity: string | null;
  minimumStock: string | null;
  updatedAt: string; // ISO
};

type ListarPosEstoqueResponse = {
  nTotPaginas?: number;
  produtos?: unknown[];
  lista?: unknown[];
};

export type OmieStockCacheOptions = {
  /**
   * Endpoint e call da Omie para posição de estoque.
   * Defaults: path='estoque/consulta/', call='ListarPosEstoque'
   */
  path?: string;
  call?: string;

  /**
   * Intervalo para considerar o cache expirado.
   * Default: 15min
   */
  refreshIntervalMs?: number;

  /**
   * Page size usado na Omie.
   * Default: 50
   */
  pageSize?: number;

  /**
   * Logger opcional (padrão: silencioso)
   */
  logger?: {
    info?: (obj: any, msg?: string) => void;
    warn?: (obj: any, msg?: string) => void;
    error?: (obj: any, msg?: string) => void;
  };
};

function formatOmieBrDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function createOmieStockCache(omieClient: OmieClient, options: OmieStockCacheOptions = {}) {
  const {
    path = "estoque/consulta/",
    call = "ListarPosEstoque",
    refreshIntervalMs = 15 * 60 * 1000,
    pageSize = 50,
    logger = {},
  } = options;

  let cache = new Map<string, OmieStockEntry>();
  let lastCompletedAt = 0;
  let lastUpdatedAt: string | null = null;
  let refreshPromise: Promise<void> | null = null;

  async function refresh(): Promise<void> {
    const nextCache = new Map<string, OmieStockEntry>();
    const updatedAt = new Date().toISOString();

    let page = 1;
    let totalPages = 1;

    do {
      const response = await omieClient.post<ListarPosEstoqueResponse>(path, {
        call,
        param: [
          {
            nPagina: page,
            nRegPorPagina: pageSize,
            dDataPosicao: formatOmieBrDate(new Date()),
            cExibeTodos: "S",
            codigo_local_estoque: 0,
          },
        ],
      });

      const items = (response.produtos ?? response.lista ?? []) as unknown[];

      for (const item of items) {
        const code = OmieAdapter.extractStockProductCode(item);
        if (!code) continue;

        nextCache.set(code, {
          stockQuantity: OmieAdapter.extractStockQuantity(item),
          minimumStock: OmieAdapter.extractMinimumStock(item),
          updatedAt,
        });
      }

      totalPages = Number(response.nTotPaginas ?? 1);
      page += 1;
    } while (page <= totalPages);

    // Atualiza cache apenas se vier algo, ou se ainda estava vazio (primeiro aquecimento)
    if (nextCache.size > 0 || cache.size === 0) {
      cache = nextCache;
      lastCompletedAt = Date.now();
      lastUpdatedAt = updatedAt;

      logger.info?.(
        { scope: "omie-stock-cache", size: cache.size, updatedAt },
        "Cache de estoque Omie atualizado"
      );
    } else {
      logger.warn?.(
        { scope: "omie-stock-cache", size: cache.size },
        "Refresh de estoque Omie retornou vazio; mantendo cache anterior"
      );
    }
  }

  async function ensureRefreshingIfNeeded(): Promise<void> {
    const isExpired = Date.now() - lastCompletedAt >= refreshIntervalMs;

    if ((cache.size === 0 || isExpired) && !refreshPromise) {
      refreshPromise = refresh().finally(() => {
        refreshPromise = null;
      });
    }

    // se cache ainda não foi aquecido, aguarda a primeira carga
    if (cache.size === 0 && refreshPromise) {
      try {
        await refreshPromise;
      } catch (error: any) {
        logger.error?.(
          { scope: "omie-stock-cache", err: error?.message ?? error },
          "Falha ao aquecer cache de estoque Omie"
        );
      }
    }
  }

  return {
    /**
     * Retorna uma cópia do snapshot do cache.
     * - dispara refresh se expirado
     * - se cache vazio, tenta aguardar aquecimento
     */
    async getSnapshot(): Promise<Map<string, OmieStockEntry>> {
      await ensureRefreshingIfNeeded();
      return new Map(cache);
    },

    getLastUpdatedAt(): string | null {
      return lastUpdatedAt;
    },

    /**
     * Força refresh imediatamente (dedup por refreshPromise).
     */
    async refreshNow(): Promise<Map<string, OmieStockEntry>> {
      if (!refreshPromise) {
        refreshPromise = refresh().finally(() => {
          refreshPromise = null;
        });
      }

      await refreshPromise;
      return new Map(cache);
    },
  };
}