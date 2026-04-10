import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { Product } from '@shared/contracts';

type ProductsResponse = {
  items: Product[];
};

export function useProducts() {
  return useQuery<ProductsResponse>({
    queryKey: ['myProducts'],
    queryFn: () => apiClient.get('/v1/products'),
  });
}
