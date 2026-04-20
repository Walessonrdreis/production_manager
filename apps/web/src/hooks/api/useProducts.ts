import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { Product } from '@shared/contracts';

type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
};

export function useProducts() {
  return useQuery<{ items: Product[]; meta: PaginationMeta }>({
    queryKey: ['myProducts'],
    queryFn: async () => {
      const response = await apiClient.get<
        { data: Product[]; meta: PaginationMeta } | { items: Product[] }
      >('/v1/admin/products');

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
