import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { Sector } from '@shared/contracts';

export function useCreateSector() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newSector: { name: string; order?: number }) =>
      apiClient.post('/v1/sectors', newSector),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sectors'] });
    },
  });
}

export function useUpdateSector() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Sector> }) =>
      apiClient.patch(`/v1/sectors/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sectors'] });
    },
  });
}

export function useDeleteSector() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/v1/sectors/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sectors'] });
    },
  });
}
