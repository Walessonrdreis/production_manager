import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { ProductionPlan } from '@shared/contracts';

type SectorGroup = {
  sector: { id: string; name: string };
  items: {
    itemId: string;
    productId: string;
    productDescription: string;
    quantity: number;
  }[];
};

export function usePlanDetails(id: string) {
  return useQuery<ProductionPlan>({
    queryKey: ['plan', id],
    queryFn: () => apiClient.get(`/v1/plans/${id}`),
    enabled: !!id,
  });
}

export function usePlanBySector(id: string) {
  return useQuery<SectorGroup[]>({
    queryKey: ['plan-by-sector', id],
    queryFn: () => apiClient.get(`/v1/plans/${id}/by-sector`),
    enabled: !!id,
  });
}
