import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';

type Sector = {
  id: string;
  name: string;
};

type Product = {
  id: string;
  omieProductId: string;
  active: boolean;
  omieProduct: {
    description: string;
    sku: string | null;
  };
  productSector: {
    sectorId: string;
    sector: Sector;
  } | null;
};

type ProductsResponse = {
  items: Product[];
};

type SectorsResponse = {
  items: Sector[];
};

export function MyProductsPage() {
  const queryClient = useQueryClient();

  // Busca dos Produtos
  const { data: productsData, isLoading: isLoadingProducts } = useQuery<ProductsResponse>({
    queryKey: ['myProducts'],
    queryFn: () => apiClient.get('/v1/products'),
  });

  // Busca dos Setores Ativos (para o dropdown)
  const { data: sectorsData, isLoading: isLoadingSectors } = useQuery<SectorsResponse>({
    queryKey: ['sectors', { activeOnly: true }],
    queryFn: () => apiClient.get('/v1/sectors'), // Por padrão nosso GET já não retorna os inativos
  });

  // Mutação para Atualizar o Setor Padrão do Produto
  const updateSectorMutation = useMutation({
    mutationFn: ({ productId, sectorId }: { productId: string; sectorId: string }) =>
      apiClient.put(`/v1/products/${productId}/sector`, { sectorId }),
    onSuccess: () => {
      // Invalida a query de produtos para recarregar a lista e atualizar o dropdown
      queryClient.invalidateQueries({ queryKey: ['myProducts'] });
    },
    onError: (error: Error) => {
      alert(`Erro ao atualizar setor: ${error.message}`);
    },
  });

  // Mutação para Remover o Produto
  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/v1/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myProducts'] });
    },
    onError: (error: Error) => {
      alert(`Erro ao remover produto: ${error.message}`);
    },
  });

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
                {product.omieProduct.description}
              </td>
              <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>
                {product.omieProduct.sku || '-'}
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
