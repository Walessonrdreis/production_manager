import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { ProductionPlan } from '@shared/contracts';

type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
};

export function usePlans() {
  return useQuery<{ items: ProductionPlan[]; meta: PaginationMeta }>({
    queryKey: ['plans'],
    queryFn: async () => {
      const response = await apiClient.get<
        { data: ProductionPlan[]; meta: PaginationMeta } | { items: ProductionPlan[] }
      >('/v1/plans');

      if ('data' in response) {
        return {
          items: response.data ?? [],
          meta: response.meta ?? { page: 1, pageSize: 0, total: 0 },
        };
      }

      const items = response.items ?? [];
      return {
        items,
        meta: { page: 1, pageSize: items.length, total: items.length },
      };
    },
    placeholderData: { items: [], meta: { page: 1, pageSize: 0, total: 0 } },
  });
}
