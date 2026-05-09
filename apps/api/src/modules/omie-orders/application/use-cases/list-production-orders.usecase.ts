export function createListProductionOrdersUseCase(deps: {
  productionOrdersRepo: {
    listOrders: (options?: {
      page?: number;
      pageSize?: number;
      filterCompleted?: boolean;
      filterCompletionDateStart?: string;
      filterCompletionDateEnd?: string;
    }) => Promise<{
      data: any[];
      meta: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
      };
    }>;
  };
}) {
  return {
    async execute(input: {
      page?: number;
      pageSize?: number;
      filterCompleted?: boolean;
      filterCompletionDateStart?: string;
      filterCompletionDateEnd?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }) {
      const {
        page = 1,
        pageSize = 50,
        filterCompleted,
        filterCompletionDateStart,
        filterCompletionDateEnd,
      } = input;

      const result = await deps.productionOrdersRepo.listOrders({
        page,
        pageSize,
        filterCompleted,
        filterCompletionDateStart,
        filterCompletionDateEnd,
      });

      return result;
    },
  };
}