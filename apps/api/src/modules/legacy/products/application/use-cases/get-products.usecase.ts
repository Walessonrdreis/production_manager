export function createGetOmieProductsUseCase(deps: {
  omieProductReadRepo: {
    listProducts: () => Promise<any[]>;
    listStockByCodes: (codes: string[]) => Promise<any[]>;
    enrichProduct: (item: any, stockByCode: Map<string, any>) => any;
  };
}) {
  return {
    async execute(): Promise<{ items: any[]; stockUpdatedAt: string | null }> {
      const items = await deps.omieProductReadRepo.listProducts();

      const codes = Array.from(
        new Set(
          items
            .map((item: any) => String(item?.omieCode ?? "").trim())
            .filter(Boolean)
        )
      );

      if (codes.length === 0) {
        return { items: [], stockUpdatedAt: null };
      }

      const stockRows = await deps.omieProductReadRepo.listStockByCodes(codes);

      const stockByCode = new Map<string, any>();
      let latestUpdatedAt: Date | null = null;

      for (const row of stockRows) {
        const code = String(row.omieCode ?? "").trim();
        if (!code) continue;

        stockByCode.set(code, row);

        const candidate: Date | null = (row.updatedAt ?? row.capturedAt) ?? null;
        if (candidate && (!latestUpdatedAt || candidate.getTime() > latestUpdatedAt.getTime())) {
          latestUpdatedAt = candidate;
        }
      }

      const enriched = items.map((item: any) =>
        deps.omieProductReadRepo.enrichProduct(item, stockByCode)
      );

      return {
        items: enriched,
        stockUpdatedAt: latestUpdatedAt ? latestUpdatedAt.toISOString() : null,
      };
    },
  };
}