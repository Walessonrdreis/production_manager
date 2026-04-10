import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { toast } from 'react-hot-toast';

export function SyncPage() {
  const syncMutation = useMutation({
    mutationFn: () => apiClient.post<{ upserted: number }>('/v1/omie/sync/products'),
    onSuccess: (data) => {
      toast.success(`${data.upserted} produtos sincronizados com sucesso!`);
    }
  });

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Sincronização Omie</h1>
      
      <p>Bem-vindo ao Gerenciador de Produção.</p>

      <div style={{ marginBottom: '2rem' }}>
        <button 
          onClick={() => syncMutation.mutate()} 
          disabled={syncMutation.isPending}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '1rem',
            cursor: syncMutation.isPending ? 'not-allowed' : 'pointer',
            backgroundColor: syncMutation.isPending ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          {syncMutation.isPending ? 'Sincronizando...' : 'Sincronizar produtos do Omie'}
        </button>
      </div>

      <hr style={{ margin: '2rem 0' }} />

      <nav>
        <h3>Navegação Rápida:</h3>
        <ul style={{ display: 'flex', gap: '1rem', listStyle: 'none', padding: 0 }}>
          <li>
            <Link to="/omie" style={{ textDecoration: 'none', color: '#007bff' }}>
              📦 Catálogo Omie
            </Link>
          </li>
          <li>
            <Link to="/products" style={{ textDecoration: 'none', color: '#007bff' }}>
              📋 Meus Produtos
            </Link>
          </li>
          <li>
            <Link to="/sectors" style={{ textDecoration: 'none', color: '#007bff' }}>
              🏭 Setores de Produção
            </Link>
          </li>
          <li>
            <Link to="/plans" style={{ textDecoration: 'none', color: '#007bff' }}>
              📅 Planos de Produção
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}
