import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { OmieProduct } from '@shared/contracts';

type OmieResponse = {
  items: OmieProduct[];
  total: number;
  families: string[];
  stockCacheUpdatedAt: string | null;
};

export function useOmieProducts(search: string, family: string, page: number, pageSize: number) {
  return useQuery<OmieResponse>({
    queryKey: ['omieProducts', search, family, page, pageSize],
    queryFn: () => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });
      
      if (search) {
        params.append('search', search);
      }

      if (family) {
        params.append('family', family);
      }
      
      return apiClient.get(`/v1/omie/products?${params.toString()}`);
    },
  });
}
