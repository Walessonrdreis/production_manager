import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';

type PlanDetail = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
};

type SectorGroup = {
  sector: { id: string; name: string };
  items: {
    itemId: string;
    productId: string;
    productDescription: string;
    quantity: number;
  }[];
};

type Product = {
  id: string;
  omieProduct: { description: string };
};

type Sector = {
  id: string;
  name: string;
};

export function PlanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [overrideSectorId, setOverrideSectorId] = useState('');

  // Busca detalhes do plano
  const { data: plan, isLoading: isLoadingPlan } = useQuery<PlanDetail>({
    queryKey: ['plan', id],
    queryFn: () => apiClient.get(`/v1/plans/${id}`),
    enabled: !!id,
  });

  // Busca a visão agrupada por setor
  const { data: groupedItems, isLoading: isLoadingGroups } = useQuery<SectorGroup[]>({
    queryKey: ['plan-by-sector', id],
    queryFn: () => apiClient.get(`/v1/plans/${id}/by-sector`),
    enabled: !!id,
  });

  // Busca lista de produtos disponíveis para adicionar ao plano
  const { data: productsData } = useQuery<{ items: Product[] }>({
    queryKey: ['myProducts'],
    queryFn: () => apiClient.get('/v1/products'),
  });

  // Busca setores para o override
  const { data: sectorsData } = useQuery<{ items: Sector[] }>({
    queryKey: ['sectors'],
    queryFn: () => apiClient.get('/v1/sectors'),
  });

  // Mutação para adicionar um item ao plano
  const addItemMutation = useMutation({
    mutationFn: (payload: { productId: string; quantity: number; sectorId?: string }) =>
      apiClient.post(`/v1/plans/${id}/items`, payload),
    onSuccess: () => {
      // Invalida as queries para recarregar a tela
      queryClient.invalidateQueries({ queryKey: ['plan', id] });
      queryClient.invalidateQueries({ queryKey: ['plan-by-sector', id] });
      // Limpa os campos do formulário
      setSelectedProductId('');
      setQuantity('');
      setOverrideSectorId('');
    },
    onError: (error: any) => {
      // Tenta parsear o erro se for JSON (nosso backend devolve { code, message })
      try {
        const errorBody = error.message.replace('Erro na requisição: ', '');
        // Como o fetch joga o statusText no Error nativo e a gente não parseou o JSON do erro no client
        // A abordagem ideal seria alterar o client para jogar o JSON no throw, 
        // mas faremos um match simples pelo texto caso contenha o código
        if (error.message.includes('MISSING_DEFAULT_SECTOR') || error.message.includes('Bad Request')) {
           alert('Este produto não possui um Setor Padrão configurado. Por favor, selecione um setor no campo "Sobrescrever Setor" ou configure um setor padrão na página "Meus Produtos".');
        } else {
           alert(`Erro ao adicionar item: ${error.message}`);
        }
      } catch (e) {
        alert(`Erro ao adicionar item: ${error.message}`);
      }
    },
  });

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !quantity || quantity <= 0) return;

    addItemMutation.mutate({
      productId: selectedProductId,
      quantity: Number(quantity),
      ...(overrideSectorId ? { sectorId: overrideSectorId } : {}),
    });
  };

  const handleExportCsv = async () => {
    try {
      // Usamos fetch direto pois precisamos lidar com Blob (download)
      const response = await fetch(`${apiClient.baseUrl}/v1/plans/${id}/export.csv`);
      if (!response.ok) throw new Error('Falha ao exportar CSV');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `plano-${id}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      alert(`Erro ao exportar: ${error.message}`);
    }
  };

  if (isLoadingPlan || isLoadingGroups) {
    return <div style={{ padding: '2rem' }}>Carregando detalhes do plano...</div>;
  }

  if (!plan) {
    return <div style={{ padding: '2rem', color: 'red' }}>Plano não encontrado.</div>;
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <Link to="/plans" style={{ textDecoration: 'none', color: '#007bff', fontSize: '0.875rem' }}>
            &larr; Voltar para Planos
          </Link>
          <h1 style={{ margin: '0.5rem 0' }}>{plan.name}</h1>
          <p style={{ margin: 0, color: '#555' }}>
            Período: {new Date(plan.startDate).toLocaleDateString('pt-BR')} até{' '}
            {new Date(plan.endDate).toLocaleDateString('pt-BR')}
            <span style={{ marginLeft: '1rem', padding: '0.2rem 0.5rem', backgroundColor: '#e2e3e5', borderRadius: '4px', fontSize: '0.8rem' }}>
              {plan.status}
            </span>
          </p>
        </div>
        <button
          onClick={handleExportCsv}
          style={{
            padding: '0.6rem 1.2rem',
            backgroundColor: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          ⬇ Exportar CSV
        </button>
      </div>

      {/* Formulário de Adicionar Item */}
      <div style={{ backgroundColor: '#f8f9fa', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
        <h3 style={{ marginTop: 0 }}>Adicionar Produto ao Plano</h3>
        <form onSubmit={handleAddItem} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 300px' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Produto</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              required
              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value="" disabled>Selecione um produto...</option>
              {productsData?.items.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.omieProduct.description}
                </option>
              ))}
            </select>
          </div>

          <div style={{ width: '120px' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Quantidade</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
              required
              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>

          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Sobrescrever Setor (Opcional)</label>
            <select
              value={overrideSectorId}
              onChange={(e) => setOverrideSectorId(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value="">(Usar Setor Padrão do Produto)</option>
              {sectorsData?.items.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={addItemMutation.isPending}
            style={{
              padding: '0.5rem 1.5rem',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: addItemMutation.isPending ? 'not-allowed' : 'pointer',
              height: '38px',
            }}
          >
            {addItemMutation.isPending ? 'Adicionando...' : 'Adicionar'}
          </button>
        </form>
      </div>

      {/* Visão Agrupada por Setor */}
      <h2>Itens de Produção</h2>
      {(!groupedItems || groupedItems.length === 0) ? (
        <p style={{ color: '#666', fontStyle: 'italic' }}>Nenhum produto adicionado a este plano ainda.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {groupedItems.map((group) => (
            <div key={group.sector.id} style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ backgroundColor: '#e9ecef', padding: '0.75rem 1rem', borderBottom: '1px solid #ddd' }}>
                <h3 style={{ margin: 0, color: '#333' }}>Setor: {group.sector.name}</h3>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #ddd', width: '70%' }}>Produto</th>
                    <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #ddd', width: '30%' }}>Quantidade</th>
                  </tr>
                </thead>
                <tbody>
                  {group.items.map((item) => (
                    <tr key={item.itemId}>
                      <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #eee' }}>
                        {item.productDescription}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>
                        {item.quantity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
