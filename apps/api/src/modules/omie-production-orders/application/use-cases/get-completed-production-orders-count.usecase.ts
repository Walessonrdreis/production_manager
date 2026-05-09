export function createGetCompletedProductionOrdersCountUseCase(deps: {
  productionOrdersRepo: {
    getCompletedOrdersCount: (startDate?: string, endDate?: string) => Promise<number>;
  };
}) {
  return {
    async execute(input: { startDate?: string; endDate?: string }) {
      const { startDate, endDate } = input;
      return deps.productionOrdersRepo.getCompletedOrdersCount(startDate, endDate);
    },
  };
}