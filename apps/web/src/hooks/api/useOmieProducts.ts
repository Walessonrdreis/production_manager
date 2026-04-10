import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { OmieProduct } from '@shared/contracts';

type OmieResponse = {
  items: OmieProduct[];
  total: number;
};

export function useOmieProducts(search: string, page: number, pageSize: number) {
  return useQuery<OmieResponse>({
    queryKey: ['omieProducts', search, page, pageSize],
    queryFn: () => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });
      
      if (search) {
        params.append('search', search);
      }
      
      return apiClient.get(`/v1/omie/products?${params.toString()}`);
    },
  });
}
