export function createGetProductionOrdersStatsUseCase(deps: {
  productionOrdersRepo: {
    getActiveOrdersCount: () => Promise<number>;
    getCompletedOrdersCount: (startDate?: string, endDate?: string) => Promise<number>;
  };
}) {
  return {
    async execute() {
      const [activeCount, completedCount] = await Promise.all([
        deps.productionOrdersRepo.getActiveOrdersCount(),
        deps.productionOrdersRepo.getCompletedOrdersCount(),
      ]);

      return {
        active: activeCount,
        completed: completedCount,
        total: activeCount + completedCount,
      };
    },
  };
}