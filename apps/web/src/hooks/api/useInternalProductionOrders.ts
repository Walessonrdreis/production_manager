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

export interface CreateInternalProductionOrderInput {
  title: string
  lote: string
  quantityValue: number
  quantityUnit: 'UN' | 'B' | 'G' | 'KG'
  omieCode?: string | null
  parsedProductName?: string | null
  productDescription?: string | null
  stockQuantity?: number | null
  minimumStock?: number | null
  source: 'MANUAL' | 'TRELLO'
  trelloCardId?: string | null
  trelloCardUrl?: string | null
}

export interface UpdateInternalProductionOrderInput {
  title?: string
  lote?: string
  quantityValue?: number
  quantityUnit?: 'UN' | 'B' | 'G' | 'KG'
  omieCode?: string | null
  parsedProductName?: string | null
  productDescription?: string | null
  stockQuantity?: number | null
  minimumStock?: number | null
}

interface ListResponse {
  items: InternalProductionOrder[]
  total: number
}

interface SingleResponse {
  data: InternalProductionOrder
}

export function useInternalProductionOrders() {
  return useQuery<ListResponse>({
    queryKey: ['internal-production-orders'],
    queryFn: () => apiClient.get('/v1/internal-production-orders'),
  });
}

export function useInternalProductionOrder(id: string | null) {
  return useQuery<SingleResponse>({
    queryKey: ['internal-production-orders', id],
    queryFn: () => apiClient.get(`/v1/internal-production-orders/${id}`),
    enabled: !!id,
  });
}

export function useCreateInternalProductionOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateInternalProductionOrderInput) =>
      apiClient.post('/v1/internal-production-orders', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-production-orders'] });
    },
  });
}

export function useUpdateInternalProductionOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInternalProductionOrderInput }) =>
      apiClient.put(`/v1/internal-production-orders/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-production-orders'] });
    },
  });
}

export function useDeleteInternalProductionOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(`/v1/internal-production-orders/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-production-orders'] });
    },
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
