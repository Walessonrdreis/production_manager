import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';

export interface InternalProductionOrder {
  id: string
  title: string
  lote: string
  quantityValue: number
  quantityUnit: 'UN' | 'B' | 'G' | 'KG'
  omieCode: string | null
  parsedProductName: string | null
  productDescription: string | null
  stockQuantity: number | null
  minimumStock: number | null
  source: 'MANUAL' | 'TRELLO'
  trelloCardId: string | null
  trelloCardUrl: string | null
  metadata: Record<string, unknown> | null
  startedAt: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
}

export function useInternalProductionOrders() {
  return useQuery<PaginatedResponse<InternalProductionOrder>>({
    queryKey: ['internal-production-orders'],
    queryFn: () => apiClient.get('/v1/internal-production-orders'),
  });
}

export function useStartInternalProductionOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, actorType }: { id: string; actorType?: string }) =>
      apiClient.patch(`/v1/internal-production-orders/${id}/start`, {}, {
        'x-actor-type': actorType || 'USER',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-production-orders'] });
    },
  });
}

export function useCompleteInternalProductionOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, actorType }: { id: string; actorType?: string }) =>
      apiClient.patch(`/v1/internal-production-orders/${id}/complete`, {}, {
        'x-actor-type': actorType || 'USER',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-production-orders'] });
    },
  });
}
