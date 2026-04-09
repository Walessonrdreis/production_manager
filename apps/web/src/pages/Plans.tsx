import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';

type Plan = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
};

type PlansResponse = {
  items: Plan[];
};

export function PlansPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Busca os planos
  const { data, isLoading, isError } = useQuery<PlansResponse>({
    queryKey: ['plans'],
    queryFn: () => apiClient.get('/v1/plans'),
  });

  // Mutação para criar um novo plano
  const createMutation = useMutation({
    mutationFn: (newPlan: { name: string; startDate: string; endDate: string }) =>
      apiClient.post<{ id: string }>('/v1/plans', newPlan),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      // Redireciona para a página de detalhes do plano recém-criado
      navigate(`/plans/${data.id}`);
    },
    onError: (error: any) => {
      alert(`Erro ao criar plano: ${error.message}`);
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !startDate || !endDate) {
      alert('Preencha todos os campos.');
      return;
    }

    createMutation.mutate({
      name,
      // Converte para ISO string para o backend (Zod exige datetime)
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
    });
  };

  const plans = data?.items || [];

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Planos de Produção</h1>
        <Link to="/" style={{ textDecoration: 'none', color: '#007bff' }}>
          Voltar para Home
        </Link>
      </div>

      {/* Formulário de Criação de Plano */}
      <form onSubmit={handleCreate} style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
        <h3>Criar Novo Plano</h3>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem' }}>Nome do Plano</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Produção de Maio"
              required
              style={{ padding: '0.5rem', width: '250px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem' }}>Data de Início</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem' }}>Data de Término</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>
          <button
            type="submit"
            disabled={createMutation.isPending}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: createMutation.isPending ? 'not-allowed' : 'pointer',
              height: '38px',
            }}
          >
            {createMutation.isPending ? 'Criando...' : 'Criar Plano'}
          </button>
        </div>
      </form>

      {/* Tabela de Planos */}
      {isLoading ? (
        <p>Carregando planos...</p>
      ) : isError ? (
        <p style={{ color: 'red' }}>Erro ao carregar a lista de planos.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5', textAlign: 'left' }}>
              <th style={{ padding: '0.75rem', border: '1px solid #ddd' }}>Nome do Plano</th>
              <th style={{ padding: '0.75rem', border: '1px solid #ddd' }}>Período</th>
              <th style={{ padding: '0.75rem', border: '1px solid #ddd' }}>Status</th>
              <th style={{ padding: '0.75rem', border: '1px solid #ddd', width: '120px' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((plan) => (
              <tr key={plan.id}>
                <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>
                  <strong>{plan.name}</strong>
                </td>
                <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>
                  {new Date(plan.startDate).toLocaleDateString('pt-BR')} até{' '}
                  {new Date(plan.endDate).toLocaleDateString('pt-BR')}
                </td>
                <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>
                  <span style={{ 
                    padding: '0.25rem 0.5rem', 
                    borderRadius: '4px',
                    backgroundColor: plan.status === 'DRAFT' ? '#fff3cd' : '#e2e3e5',
                    color: plan.status === 'DRAFT' ? '#856404' : '#383d41',
                    fontSize: '0.875rem'
                  }}>
                    {plan.status}
                  </span>
                </td>
                <td style={{ padding: '0.75rem', border: '1px solid #ddd', textAlign: 'center' }}>
                  <Link
                    to={`/plans/${plan.id}`}
                    style={{
                      display: 'inline-block',
                      padding: '0.4rem 0.8rem',
                      backgroundColor: '#007bff',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '4px',
                      fontSize: '0.875rem'
                    }}
                  >
                    Gerenciar
                  </Link>
                </td>
              </tr>
            ))}
            {plans.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: '1rem', textAlign: 'center', border: '1px solid #ddd' }}>
                  Nenhum plano de produção cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
