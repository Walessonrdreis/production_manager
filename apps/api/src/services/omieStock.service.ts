import { AppError } from '../core/errors/AppError';
import { OmieAdapter } from '../integrations/omie/OmieAdapter';
import { omieStockCache } from '../integrations/omie/OmieStockCache';

export async function getStockByRawPayload(rawPayload: any): Promise<{
  omieCode: string;
  stockQuantity: string;
  minimumStock: string;
  stockCacheUpdatedAt: string;
}> {
  const omieCode = OmieAdapter.extractProductCode(rawPayload)?.trim();

  if (!omieCode) {
    throw new AppError('OMIE_CODE_NOT_FOUND', 422, 'Omie code not found');
  }

  const snapshot = await omieStockCache.getSnapshot();
  const stockCacheUpdatedAt = omieStockCache.getLastUpdatedAt();

  if (!stockCacheUpdatedAt) {
    throw new AppError('STOCK_NOT_AVAILABLE', 503, 'Stock snapshot not available');
  }

  const entry = snapshot.get(omieCode);

  return {
    omieCode,
    stockQuantity: entry?.stockQuantity ?? '0',
    minimumStock: entry?.minimumStock ?? '0',
    stockCacheUpdatedAt,
  };
}
