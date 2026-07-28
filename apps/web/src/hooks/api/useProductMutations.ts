import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';

export function useUpdateProductSector() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, sectorId }: { productId: string; sectorId: string }) =>
      apiClient.put(`/v1/products/${productId}/sector`, { sectorId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myProducts'] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/v1/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myProducts'] });
    },
  });
}
