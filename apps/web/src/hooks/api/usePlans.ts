import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { ProductionPlan } from '@shared/contracts';

type PlansResponse = {
  items: ProductionPlan[];
};

export function usePlans() {
  return useQuery<PlansResponse>({
    queryKey: ['plans'],
    queryFn: () => apiClient.get('/v1/plans'),
  });
}
