export function createGetProductionOrdersByProductIntegrationCodeUseCase(deps: {
  productionOrdersRepo: {
    getOrdersByProductIntegrationCode: (integrationCode: string) => Promise<any[]>;
  };
}) {
  return {
    async execute(input: { integrationCode: string; page?: number; pageSize?: number }) {
      const { integrationCode, page = 1, pageSize = 50 } = input;
      
      const orders = await deps.productionOrdersRepo.getOrdersByProductIntegrationCode(integrationCode);
      
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedOrders = orders.slice(startIndex, endIndex);
      
      return {
        data: paginatedOrders,
        meta: {
          page,
          pageSize,
          total: orders.length,
          totalPages: Math.ceil(orders.length / pageSize),
        },
      };
    },
  };
}