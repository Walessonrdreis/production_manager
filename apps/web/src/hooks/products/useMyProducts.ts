import { useProducts } from '../../hooks/api/useProducts';
import { useSectors } from '../../hooks/api/useSectors';
import {
  useUpdateProductSector,
  useDeleteProduct,
} from '../../hooks/api/useProductMutations';

export function useMyProducts() {
  const { data: productsData, isLoading: isLoadingProducts } = useProducts();
  const { data: sectorsData, isLoading: isLoadingSectors } = useSectors(false);

  const updateSectorMutation = useUpdateProductSector();
  const deleteProductMutation = useDeleteProduct();

  const products = productsData?.items ?? [];
  const sectors = sectorsData?.items ?? [];

  const isLoading = isLoadingProducts || isLoadingSectors;

  return {
    isLoading,

    products,
    sectors,

    updateSectorMutation,
    deleteProductMutation,
  };
}
``