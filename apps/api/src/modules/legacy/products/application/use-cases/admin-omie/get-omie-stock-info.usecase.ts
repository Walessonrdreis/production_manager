export function createGetOmieStockInfoUseCase(deps: { prisma: any }) {
  return {
    async execute() {
      const rows = await deps.prisma.$queryRaw<
        Array<{ lastRefreshAt: Date | null; totalItems: bigint | number | null }>
      >`
        SELECT
          MAX("captured_at") AS "lastRefreshAt",
          COUNT(DISTINCT "omie_code") AS "totalItems"
        FROM "product_stock"
      `;

      const row = rows[0] ?? { lastRefreshAt: null, totalItems: 0 };

      const totalItems =
        typeof row.totalItems === "bigint"
          ? Number(row.totalItems)
          : row.totalItems ?? 0;

      return {
        lastRefreshAt: row.lastRefreshAt
          ? row.lastRefreshAt.toISOString()
          : null,
        totalItems,
        source: "database",
      };
    },
  };
}