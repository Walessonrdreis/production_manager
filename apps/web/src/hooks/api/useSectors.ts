import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { Sector } from '@shared/contracts';

type SectorsResponse = {
  items: Sector[];
};

export function useSectors(includeInactive: boolean = false) {
  return useQuery<SectorsResponse>({
    queryKey: ['sectors', { includeInactive }],
    queryFn: () => {
      const params = new URLSearchParams();
      if (includeInactive) {
        params.append('includeInactive', 'true');
      }
      return apiClient.get(`/v1/sectors?${params.toString()}`);
    },
  });
}
