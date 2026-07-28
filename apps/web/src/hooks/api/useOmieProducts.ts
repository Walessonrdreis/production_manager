import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { OmieProduct } from '@shared/contracts';

type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
};

type OmieProductsData = {
  items: OmieProduct[];
  meta: PaginationMeta;
  families: string[];
  stockCacheUpdatedAt: string | null;
};

type OmieProductsApiV2 = {
  data: OmieProduct[];
  meta: PaginationMeta & {
    families?: string[];
    stockCacheUpdatedAt?: string | null;
  };
};

type OmieProductsApiLegacy = {
  items: OmieProduct[];
  total: number;
  families: string[];
  stockCacheUpdatedAt: string | null;
};

export function useOmieProducts(search: string, family: string, page: number, pageSize: number) {
  return useQuery<OmieProductsData>({
    queryKey: ['omieProducts', search, family, page, pageSize],
    queryFn: async () => {
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
      
      const response = await apiClient.get<OmieProductsApiV2 | OmieProductsApiLegacy>(
        `/v1/omie/products?${params.toString()}`
      );

      if ('data' in response) {
        return {
          items: response.data ?? [],
          meta: {
            page: response.meta?.page ?? 1,
            pageSize: response.meta?.pageSize ?? 0,
            total: response.meta?.total ?? 0,
          },
          families: response.meta?.families ?? [],
          stockCacheUpdatedAt: response.meta?.stockCacheUpdatedAt ?? null,
        };
      }

      return {
        items: response.items ?? [],
        meta: {
          page: page,
          pageSize: pageSize,
          total: response.total ?? 0,
        },
        families: response.families ?? [],
        stockCacheUpdatedAt: response.stockCacheUpdatedAt ?? null,
      };
    },
    placeholderData: {
      items: [],
      meta: { page: 1, pageSize: 0, total: 0 },
      families: [],
      stockCacheUpdatedAt: null,
    },
  });
}
