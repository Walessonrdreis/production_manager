// src/modules/products/application/use-cases/get-managed-product-stock-history.usecase.ts
import { toNumber } from "../utils/to-number";

export function createGetManagedProductStockHistoryUseCase(deps: {
  resolveOmieCodeFromProduct: { execute: (input: { productId: string }) => Promise<{ productId: string; omieCode: string }> };
  productStockRepo: {
    countByOmieCode: (omieCode: string) => Promise<number>;
    listByOmieCode: (omieCode: string, page: number, pageSize: number) => Promise<any[]>;
  };
}) {
  return {
    async execute(input: { id: string; page: number; pageSize: number }) {
      const { productId, omieCode } = await deps.resolveOmieCodeFromProduct.execute({ productId: input.id });

      const safePageSize = Math.min(input.pageSize, 100);

      const [total, rows] = await Promise.all([
        deps.productStockRepo.countByOmieCode(omieCode),
        deps.productStockRepo.listByOmieCode(omieCode, input.page, safePageSize),
      ]);

      const items = rows.map((row: any) => {
        const rawQty = toNumber(row.stockQuantity);
        const rawMin = toNumber(row.minimumStock);
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
          capturedAt: row.capturedAt,
        };
      });

      return {
        items,
        meta: {
          page: input.page,
          pageSize: safePageSize,
          total,
        },
      };
    },
  };
}