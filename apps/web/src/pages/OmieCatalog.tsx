import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useDebounce } from '../hooks/useDebounce';
import { useOmieProducts } from '../hooks/api/useOmieProducts';
import { toast } from 'react-hot-toast';

export function OmieCatalogPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [family, setFamily] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [page, setPage] = useState(1);
  const isFamilyFiltered = Boolean(family);
  const pageSize = isFamilyFiltered ? 5000 : 20;

  const { data, isLoading } = useOmieProducts(debouncedSearch, family, page, pageSize);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, family]);

  // Seleção de Produto
  const selectMutation = useMutation({
    mutationFn: (omieProductId: string) => 
      apiClient.post('/v1/products', { omieProductId }),
    onSuccess: () => {
      toast.success('Produto selecionado com sucesso!');
      // Invalida a lista de 'Meus Produtos' para quando navegarmos para lá
      queryClient.invalidateQueries({ queryKey: ['myProducts'] });
    }
  });

  const refreshStockMutation = useMutation({
    mutationFn: () => apiClient.post<{ stockCacheUpdatedAt: string | null }>('/v1/omie/products/stock/refresh'),
    onSuccess: () => {
      toast.success('Estoque Omie atualizado manualmente.');
      queryClient.invalidateQueries({ queryKey: ['omieProducts'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Falha ao atualizar estoque da Omie.');
    },
  });

  const totalPages = data && !isFamilyFiltered ? Math.ceil(data.total / pageSize) : 0;

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Catálogo Omie</h1>
        <Link to="/" style={{ textDecoration: 'none', color: '#007bff' }}>
          Voltar para Home
        </Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem' }}>Buscar</label>
            <input
              type="text"
              placeholder="Buscar por descrição, código, SKU ou família..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: '0.5rem',
                width: '320px',
                fontSize: '1rem',
                borderRadius: '4px',
                border: '1px solid #ccc'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem' }}>Família</label>
            <select
              value={family}
              onChange={(e) => setFamily(e.target.value)}
              style={{
                padding: '0.5rem',
                minWidth: '220px',
                fontSize: '1rem',
                borderRadius: '4px',
                border: '1px solid #ccc'
              }}
            >
              <option value="">Todas as famílias</option>
              {data?.families.map((familyOption) => (
                <option key={familyOption} value={familyOption}>
                  {familyOption}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
          <div style={{ color: '#475569', fontSize: '0.9rem' }}>
            Última atualização do estoque:{' '}
            <strong>
              {data?.stockCacheUpdatedAt
                ? new Date(data.stockCacheUpdatedAt).toLocaleString('pt-BR')
                : 'Ainda não carregado'}
            </strong>
          </div>
          <button
            type="button"
            onClick={() => refreshStockMutation.mutate()}
            disabled={refreshStockMutation.isPending}
            style={{
              padding: '0.5rem 0.9rem',
              backgroundColor: refreshStockMutation.isPending ? '#94a3b8' : '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: refreshStockMutation.isPending ? 'not-allowed' : 'pointer',
              fontWeight: 600,
            }}
          >
            {refreshStockMutation.isPending ? 'Atualizando...' : 'Atualizar estoque agora'}
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <input
          type="text"
          readOnly
          value={`Atualização automática a cada 15 minutos${family ? ` • Família: ${family}` : ''}`}
          style={{
            padding: '0.5rem',
            width: '420px',
            fontSize: '0.95rem',
            borderRadius: '4px',
            border: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            color: '#475569'
          }}
        />
      </div>

      {isLoading && <p>Carregando catálogo...</p>}

      {!isLoading && data && (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem', border: '1px solid #ddd' }}>Código</th>
                <th style={{ padding: '0.75rem', border: '1px solid #ddd' }}>Descrição</th>
                <th style={{ padding: '0.75rem', border: '1px solid #ddd' }}>Família</th>
                <th style={{ padding: '0.75rem', border: '1px solid #ddd' }}>SKU</th>
                <th style={{ padding: '0.75rem', border: '1px solid #ddd' }}>Estoque</th>
                <th style={{ padding: '0.75rem', border: '1px solid #ddd' }}>Estoque mínimo</th>
                <th style={{ padding: '0.75rem', border: '1px solid #ddd' }}>Status Omie</th>
                <th style={{ padding: '0.75rem', border: '1px solid #ddd', width: '120px' }}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((product) => (
                <tr key={product.id}>
                  <td style={{ padding: '0.75rem', border: '1px solid #ddd', fontFamily: 'monospace' }}>
                    {product.code || product.omieId}
                  </td>
                  <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>{product.description}</td>
                  <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>{product.familyDescription ?? '-'}</td>
                  <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>{product.sku || '-'}</td>
                  <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>{product.stockQuantity ?? 'Não informado'}</td>
                  <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>{product.minimumStock ?? 'Não informado'}</td>
                  <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '4px',
                      backgroundColor: product.active ? '#e6ffe6' : '#ffe6e6',
                      color: product.active ? '#006600' : '#cc0000'
                    }}>
                      {product.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', border: '1px solid #ddd', textAlign: 'center' }}>
                    <button
                      onClick={() => selectMutation.mutate(product.id)}
                      disabled={selectMutation.isPending}
                      style={{
                        padding: '0.4rem 0.8rem',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: selectMutation.isPending ? 'not-allowed' : 'pointer',
                        opacity: selectMutation.isPending ? 0.7 : 1
                      }}
                    >
                      Selecionar
                    </button>
                  </td>
                </tr>
              ))}
              {data.items.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: '1rem', textAlign: 'center', border: '1px solid #ddd' }}>
                    Nenhum produto encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Paginação */}
          {!isFamilyFiltered && totalPages > 1 && (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ padding: '0.5rem 1rem' }}
              >
                Anterior
              </button>
              <span>Página {page} de {totalPages}</span>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{ padding: '0.5rem 1rem' }}
              >
                Próxima
              </button>
            </div>
          )}

          {isFamilyFiltered && (
            <div style={{ color: '#475569', fontSize: '0.95rem' }}>
              Exibindo todos os produtos da família selecionada: <strong>{data.total}</strong> item(ns).
            </div>
          )}
        </>
      )}
    </div>
  );
}
