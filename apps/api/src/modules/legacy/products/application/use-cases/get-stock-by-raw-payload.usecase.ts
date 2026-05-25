import { AppError } from "@/shared/errors/AppError";
import { OmieAdapter } from "@/shared/integrations/omie";

export function createGetStockByRawPayloadUseCase(deps: {
  omieStockCache: {
    getSnapshot: () => Promise<Map<string, any>>;
    getLastUpdatedAt: () => string | null;
  };
}) {
  return {
    async execute(rawPayload: unknown): Promise<{
      omieCode: string;
      stockQuantity: string;
      minimumStock: string;
      stockCacheUpdatedAt: string;
    }> {
      const omieCode = OmieAdapter.extractProductCode(rawPayload)?.trim();

      if (!omieCode) {
        throw new AppError("OMIE_CODE_NOT_FOUND", 422, "Omie code not found");
      }

      const snapshot = await deps.omieStockCache.getSnapshot();
      const stockCacheUpdatedAt = deps.omieStockCache.getLastUpdatedAt();

      if (!stockCacheUpdatedAt) {
        throw new AppError(
          "STOCK_NOT_AVAILABLE",
          503,
          "Stock snapshot not available"
        );
      }

      const entry = snapshot.get(omieCode);

      return {
        omieCode,
        stockQuantity: entry?.stockQuantity ?? "0",
        minimumStock: entry?.minimumStock ?? "0",
        stockCacheUpdatedAt,
      };
    },
  };
}