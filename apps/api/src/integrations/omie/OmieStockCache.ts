import { omieClient } from './OmieClient';
import { OmieAdapter } from './OmieAdapter';

type OmieStockEntry = {
  stockQuantity: string | null;
  minimumStock: string | null;
  updatedAt: string;
};

type ListarPosEstoqueResponse = {
  nTotPaginas?: number;
  produtos?: any[];
  lista?: any[];
};

const OMIE_STOCK_PATH = 'estoque/consulta/';
const REFRESH_INTERVAL_MS = 15 * 60 * 1000;
const PAGE_SIZE = 50;

function formatOmieDate(date: Date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export class OmieStockCache {
  private cache = new Map<string, OmieStockEntry>();
  private lastCompletedAt = 0;
  private lastUpdatedAt: string | null = null;
  private refreshPromise: Promise<void> | null = null;

  async getSnapshot(): Promise<Map<string, OmieStockEntry>> {
    const isExpired = Date.now() - this.lastCompletedAt >= REFRESH_INTERVAL_MS;

    if ((this.cache.size === 0 || isExpired) && !this.refreshPromise) {
      this.refreshPromise = this.refresh().finally(() => {
        this.refreshPromise = null;
      });
    }

    if (this.cache.size === 0 && this.refreshPromise) {
      try {
        await this.refreshPromise;
      } catch (error) {
        console.error('Falha ao aquecer cache de estoque Omie', error);
      }
    }

    return new Map(this.cache);
  }

  getLastUpdatedAt(): string | null {
    return this.lastUpdatedAt;
  }

  async refreshNow(): Promise<Map<string, OmieStockEntry>> {
    if (!this.refreshPromise) {
      this.refreshPromise = this.refresh().finally(() => {
        this.refreshPromise = null;
      });
    }

    await this.refreshPromise;
    return new Map(this.cache);
  }

  private async refresh(): Promise<void> {
    const nextCache = new Map<string, OmieStockEntry>();
    const updatedAt = new Date().toISOString();
    let page = 1;
    let totalPages = 1;

    do {
      const response = await omieClient.post<ListarPosEstoqueResponse>(OMIE_STOCK_PATH, {
        call: 'ListarPosEstoque',
        param: [
          {
            nPagina: page,
            nRegPorPagina: PAGE_SIZE,
            dDataPosicao: formatOmieDate(new Date()),
            cExibeTodos: 'S',
            codigo_local_estoque: 0,
          },
        ],
      });

      const items = response.produtos ?? response.lista ?? [];

      for (const item of items) {
        const code = OmieAdapter.extractStockProductCode(item);

        if (!code) {
          continue;
        }

        nextCache.set(code, {
          stockQuantity: OmieAdapter.extractStockQuantity(item),
          minimumStock: OmieAdapter.extractMinimumStock(item),
          updatedAt,
        });
      }

      totalPages = Number(response.nTotPaginas ?? 1);
      page += 1;
    } while (page <= totalPages);

    if (nextCache.size > 0 || this.cache.size === 0) {
      this.cache = nextCache;
      this.lastCompletedAt = Date.now();
      this.lastUpdatedAt = updatedAt;
    }
  }
}

export const omieStockCache = new OmieStockCache();
