"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStockByRawPayload = getStockByRawPayload;
const AppError_1 = require("../core/errors/AppError");
const OmieAdapter_1 = require("../integrations/omie/OmieAdapter");
const OmieStockCache_1 = require("../integrations/omie/OmieStockCache");
async function getStockByRawPayload(rawPayload) {
    const omieCode = OmieAdapter_1.OmieAdapter.extractProductCode(rawPayload)?.trim();
    if (!omieCode) {
        throw new AppError_1.AppError('OMIE_CODE_NOT_FOUND', 422, 'Omie code not found');
    }
    const snapshot = await OmieStockCache_1.omieStockCache.getSnapshot();
    const stockCacheUpdatedAt = OmieStockCache_1.omieStockCache.getLastUpdatedAt();
    if (!stockCacheUpdatedAt) {
        throw new AppError_1.AppError('STOCK_NOT_AVAILABLE', 503, 'Stock snapshot not available');
    }
    const entry = snapshot.get(omieCode);
    return {
        omieCode,
        stockQuantity: entry?.stockQuantity ?? '0',
        minimumStock: entry?.minimumStock ?? '0',
        stockCacheUpdatedAt,
    };
}
