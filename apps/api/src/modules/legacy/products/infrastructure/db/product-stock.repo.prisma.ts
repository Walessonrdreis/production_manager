export type ProductStockUpsertRow = {
  omieCode: string;
  stockQuantity: string;
  minimumStock: string;
  capturedAt: Date;
};

export function createProductStockRepoPrisma(prisma: any) {
  const productStock = (prisma as any).productStock ?? prisma.productStock;

  return {
    // ✅ leitura: usado por get-managed-product-stock
    async latestByOmieCode(omieCode: string) {
      const rows = await productStock.findMany({
        where: { omieCode },
        orderBy: { capturedAt: "desc" },
        take: 1,
        select: {
          stockQuantity: true,
          minimumStock: true,
          capturedAt: true,
          updatedAt: true,
        },
      });

      return rows[0] ?? null;
    },

    // ✅ leitura: usado por get-managed-product-stock-history
    async countByOmieCode(omieCode: string) {
      return productStock.count({ where: { omieCode } });
    },

    // ✅ leitura: usado por get-managed-product-stock-history
    async listByOmieCode(omieCode: string, page: number, pageSize: number) {
      return productStock.findMany({
        where: { omieCode },
        orderBy: { capturedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          stockQuantity: true,
          minimumStock: true,
          capturedAt: true,
          updatedAt: true,
        },
      });
    },

    // ✅ escrita em lote: usado por refresh-stock.usecase
    async upsertBatch(rows: ProductStockUpsertRow[]) {
      if (!rows.length) return;

      await prisma.$transaction(
        rows.map((row) =>
          productStock.upsert({
            where: { omieCode: row.omieCode },
            create: {
              omieCode: row.omieCode,
              stockQuantity: row.stockQuantity,
              minimumStock: row.minimumStock,
              capturedAt: row.capturedAt,
            },
            update: {
              stockQuantity: row.stockQuantity,
              minimumStock: row.minimumStock,
              capturedAt: row.capturedAt,
              updatedAt: row.capturedAt,
            },
          })
        )
      );
    },
  };
}