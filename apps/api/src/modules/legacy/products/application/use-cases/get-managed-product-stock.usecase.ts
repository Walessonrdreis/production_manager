// src/modules/products/application/use-cases/get-managed-product-stock.usecase.ts
import { AppError } from "@/shared/errors/AppError";
import { toNumber } from "../../utils/to-number";

export function createGetManagedProductStockUseCase(deps: {
  resolveOmieCodeFromProduct: { execute: (input: { productId: string }) => Promise<{ productId: string; omieCode: string }> };
  productStockRepo: { latestByOmieCode: (omieCode: string) => Promise<any | null> };
}) {
  return {
    async execute(input: { id: string }) {
      const { productId, omieCode } = await deps.resolveOmieCodeFromProduct.execute({ productId: input.id });

      const latest = await deps.productStockRepo.latestByOmieCode(omieCode);
      if (!latest) throw new AppError("STOCK_NOT_FOUND", 404, "Stock not found");

      const rawQty = toNumber(latest.stockQuantity);
      const rawMin = toNumber(latest.minimumStock);
      const reported = rawQty != null || rawMin != null;

      const quantity = (rawQty ?? 0).toFixed(4);
      const minimum = (rawMin ?? 0).toFixed(4);

      return {
        productId,
        omieCode,
        quantity,
        reported,
        rawQuantity: rawQty == null ? null : rawQty.toFixed(4),
        minimum,
        rawMinimum: rawMin == null ? null : rawMin.toFixed(4),
        stockQuantity: quantity,
        minimumStock: minimum,
        capturedAt: latest.capturedAt,
      };
    },
  };
}