export function createGetStage20TotalsUseCase(deps: { prisma: any }) {
  return {
    async execute() {
      type Row = { description: string; total_quantity: any };

      const rows = await deps.prisma.$queryRaw<Row[]>`
        SELECT
          i.description,
          SUM(i.quantity) AS total_quantity
        FROM omie_order_item i
        JOIN omie_order o ON o.id = i."omieOrderId"
        WHERE
          o.etapa = '20'
          AND o.cancelado = 'N'
          AND o.encerrado = 'N'
        GROUP BY i.description
        ORDER BY total_quantity DESC
      `;

      return rows.map((r: Row) => ({
        description: r.description,
        totalQuantity: Number(r.total_quantity),
      }));
    },
  };
}