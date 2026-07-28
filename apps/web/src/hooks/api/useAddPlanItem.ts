import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { ProductionPlanItem } from '@shared/contracts';

type AddPlanItemInput = {
  productId: string;
  quantity: number;
  sectorId?: string;
  notes?: string;
};

export function useAddPlanItem(planId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AddPlanItemInput) =>
      apiClient.post<ProductionPlanItem>(`/v1/plans/${planId}/items`, payload),
    onSuccess: () => {
      // Invalida as queries do plano para atualizar a tela
      queryClient.invalidateQueries({ queryKey: ['plan', planId] });
      queryClient.invalidateQueries({ queryKey: ['plan-by-sector', planId] });
    },
  });
}
