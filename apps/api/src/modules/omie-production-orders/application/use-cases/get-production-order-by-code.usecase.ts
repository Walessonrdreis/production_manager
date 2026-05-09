export function createGetProductionOrderByCodeUseCase(deps: {
  productionOrdersRepo: {
    getOrderByCode: (omieCode: string) => Promise<any>;
  };
}) {
  return {
    async execute(input: { omieCode: string }) {
      const order = await deps.productionOrdersRepo.getOrderByCode(input.omieCode);
      return order;
    },
  };
}