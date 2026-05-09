export function createGetActiveProductionOrdersCountUseCase(deps: {
  productionOrdersRepo: {
    getActiveOrdersCount: () => Promise<number>;
  };
}) {
  return {
    async execute() {
      return deps.productionOrdersRepo.getActiveOrdersCount();
    },
  };
}