import { useMyProducts } from '../hooks/products/useMyProducts';
import { MyProductsHeader } from '../components/products/MyProductsHeader';
import { MyProductsTable } from '../components/products/MyProductsTable';

export function MyProductsPage() {
  const {
    isLoading,
    products,
    sectors,
    updateSectorMutation,
    deleteProductMutation,
  } = useMyProducts();

  if (isLoading) {
    return <div style={{ padding: '2rem' }}>Carregando...</div>;
  }

  return (
    <div
      style={{
        padding: '2rem',
        fontFamily: 'sans-serif',
        maxWidth: '1200px',
        margin: '0 auto',
      }}
    >
      <MyProductsHeader />

      <MyProductsTable
        products={products}
        sectors={sectors}
        onUpdateSector={(productId, sectorId) => {
          if (sectorId) {
            updateSectorMutation.mutate({ productId, sectorId });
          }
        }}
        onRemove={(productId) => {
          deleteProductMutation.mutate(productId);
        }}
        isUpdating={updateSectorMutation.isPending}
        isRemoving={deleteProductMutation.isPending}
      />
    </div>
  );
}
