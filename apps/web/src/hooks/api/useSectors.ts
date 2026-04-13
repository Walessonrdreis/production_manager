import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { Sector } from '@shared/contracts';

type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
};

export function useSectors(includeInactive: boolean = false) {
  return useQuery<{ items: Sector[]; meta: PaginationMeta }>({
    queryKey: ['sectors', { includeInactive }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (includeInactive) {
        params.append('includeInactive', 'true');
      }

      const response = await apiClient.get<
        { data: Sector[]; meta: PaginationMeta } | { items: Sector[] }
      >(`/v1/sectors?${params.toString()}`);

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
