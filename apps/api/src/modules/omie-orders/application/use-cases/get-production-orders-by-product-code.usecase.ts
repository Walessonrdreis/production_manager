export function createGetProductionOrdersByProductCodeUseCase(deps: {
  productionOrdersRepo: {
    getOrdersByProductCode: (productCode: string) => Promise<any[]>;
  };
}) {
  return {
    async execute(input: { productCode: string; page?: number; pageSize?: number }) {
      const { productCode, page = 1, pageSize = 50 } = input;
      
      const orders = await deps.productionOrdersRepo.getOrdersByProductCode(productCode);
      
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