import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { useProducts } from '../../hooks/api/useProducts';
import { useSectors } from '../../hooks/api/useSectors';
import {
  useUpdateProductSector,
  useDeleteProduct,
} from '../../hooks/api/useProductMutations';
import type { OmieProduct, Product } from '@shared/contracts';

type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
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

export function useMyProducts() {
  const { data: productsData, isLoading: isLoadingProducts } = useProducts();
  const { data: sectorsData, isLoading: isLoadingSectors } = useSectors(false);

  const updateSectorMutation = useUpdateProductSector();
  const deleteProductMutation = useDeleteProduct();

  const baseProducts = productsData?.items ?? [];
  const sectors = sectorsData?.items ?? [];

  const omieProductIds = useMemo(() => {
    const ids = new Set<string>();
    for (const product of baseProducts) {
      if (product?.omieProductId) ids.add(product.omieProductId);
    }
    return Array.from(ids);
  }, [baseProducts]);

  const omieProductsQuery = useQuery<Map<string, OmieProduct>>({
    queryKey: ['omieProductsForMyProducts', omieProductIds],
    enabled: omieProductIds.length > 0,
    queryFn: async () => {
      const required = new Set(omieProductIds);
      const found = new Map<string, OmieProduct>();

      let page = 1;
      const pageSize = 5000;
      let total = Number.POSITIVE_INFINITY;

      while (found.size < required.size && (page - 1) * pageSize < total) {
        const params = new URLSearchParams({
          page: page.toString(),
          pageSize: pageSize.toString(),
        });

        const response = await apiClient.get<OmieProductsApiV2 | OmieProductsApiLegacy>(
          `/v1/omie/products?${params.toString()}`
        );

        const items: OmieProduct[] = 'data' in response ? response.data ?? [] : response.items ?? [];

        if ('data' in response) {
          total = response.meta?.total ?? items.length;
        } else {
          total = response.total ?? items.length;
        }

        for (const item of items) {
          if (required.has(item.id)) {
            found.set(item.id, item);
          }
        }

        if (items.length < pageSize) break;
        page += 1;
      }

      return found;
    },
    placeholderData: new Map(),
  });

  const products = useMemo(() => {
    const omieProductsById = omieProductsQuery.data;
    if (!omieProductsById || omieProductsById.size === 0) return baseProducts;

    return baseProducts.map((product): Product => {
      const freshOmie = omieProductsById.get(product.omieProductId);
      if (!freshOmie) return product;
      return { ...product, omieProduct: freshOmie };
    });
  }, [baseProducts, omieProductsQuery.data]);

  const isLoading =
    isLoadingProducts || isLoadingSectors || (omieProductIds.length > 0 && omieProductsQuery.isLoading);

  return {
    isLoading,

    products,
    sectors,

    updateSectorMutation,
    deleteProductMutation,
  };
}
