"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.omieStockCache = exports.OmieStockCache = void 0;
const OmieClient_1 = require("./OmieClient");
const OmieAdapter_1 = require("./OmieAdapter");
const OMIE_STOCK_PATH = 'estoque/consulta/';
const REFRESH_INTERVAL_MS = 15 * 60 * 1000;
const PAGE_SIZE = 50;
function formatOmieDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}
class OmieStockCache {
    cache = new Map();
    lastCompletedAt = 0;
    refreshPromise = null;
    async getSnapshot() {
        const isExpired = Date.now() - this.lastCompletedAt >= REFRESH_INTERVAL_MS;
        if ((this.cache.size === 0 || isExpired) && !this.refreshPromise) {
            this.refreshPromise = this.refresh().finally(() => {
                this.refreshPromise = null;
            });
        }
        if (this.cache.size === 0 && this.refreshPromise) {
            try {
                await this.refreshPromise;
            }
            catch (error) {
                console.error('Falha ao aquecer cache de estoque Omie', error);
            }
        }
        return new Map(this.cache);
    }
    async refresh() {
        const nextCache = new Map();
        const updatedAt = new Date().toISOString();
        let page = 1;
        let totalPages = 1;
        do {
            const response = await OmieClient_1.omieClient.post(OMIE_STOCK_PATH, {
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
                const code = OmieAdapter_1.OmieAdapter.extractStockProductCode(item);
                if (!code) {
                    continue;
                }
                nextCache.set(code, {
                    stockQuantity: OmieAdapter_1.OmieAdapter.extractStockQuantity(item),
                    minimumStock: OmieAdapter_1.OmieAdapter.extractMinimumStock(item),
                    updatedAt,
                });
            }
            totalPages = Number(response.nTotPaginas ?? 1);
            page += 1;
        } while (page <= totalPages);
        if (nextCache.size > 0 || this.cache.size === 0) {
            this.cache = nextCache;
            this.lastCompletedAt = Date.now();
        }
    }
}
exports.OmieStockCache = OmieStockCache;
exports.omieStockCache = new OmieStockCache();
