import { Link } from 'react-router-dom';
import { useProducts } from '../hooks/api/useProducts';
import { useSectors } from '../hooks/api/useSectors';
import { useUpdateProductSector, useDeleteProduct } from '../hooks/api/useProductMutations';

export function MyProductsPage() {
  const { data: productsData, isLoading: isLoadingProducts } = useProducts();
  const { data: sectorsData, isLoading: isLoadingSectors } = useSectors(false);
  
  const updateSectorMutation = useUpdateProductSector();
  const deleteProductMutation = useDeleteProduct();

  if (isLoadingProducts || isLoadingSectors) {
    return <div style={{ padding: '2rem' }}>Carregando...</div>;
  }

  const products = productsData?.items || [];
  const sectors = sectorsData?.items || [];

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Meus Produtos</h1>
        <Link to="/" style={{ textDecoration: 'none', color: '#007bff' }}>
          Voltar para Home
        </Link>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5', textAlign: 'left' }}>
            <th style={{ padding: '0.75rem', border: '1px solid #ddd' }}>Descrição Omie</th>
            <th style={{ padding: '0.75rem', border: '1px solid #ddd' }}>SKU</th>
            <th style={{ padding: '0.75rem', border: '1px solid #ddd' }}>Setor Padrão</th>
            <th style={{ padding: '0.75rem', border: '1px solid #ddd', width: '100px' }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>
                {product.omieProduct?.description}
              </td>
              <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>
                {product.omieProduct?.sku || '-'}
              </td>
              <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>
                <select
                  value={product.productSector?.sectorId || ''}
                  onChange={(e) => {
                    const sectorId = e.target.value;
                    if (sectorId) {
                      updateSectorMutation.mutate({ productId: product.id, sectorId });
                    }
                  }}
                  disabled={updateSectorMutation.isPending}
                  style={{ padding: '0.4rem', borderRadius: '4px', width: '100%' }}
                >
                  <option value="" disabled>Selecione um setor...</option>
                  {sectors.map((sector) => (
                    <option key={sector.id} value={sector.id}>
                      {sector.name}
                    </option>
                  ))}
                </select>
              </td>
              <td style={{ padding: '0.75rem', border: '1px solid #ddd', textAlign: 'center' }}>
                <button
                  onClick={() => {
                    if (window.confirm('Tem certeza que deseja remover este produto da sua seleção?')) {
                      deleteProductMutation.mutate(product.id);
                    }
                  }}
                  disabled={deleteProductMutation.isPending}
                  style={{
                    padding: '0.4rem 0.8rem',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: deleteProductMutation.isPending ? 'not-allowed' : 'pointer',
                  }}
                >
                  Remover
                </button>
              </td>
            </tr>
          ))}
          {products.length === 0 && (
            <tr>
              <td colSpan={4} style={{ padding: '1rem', textAlign: 'center', border: '1px solid #ddd' }}>
                Nenhum produto selecionado do Catálogo Omie.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
