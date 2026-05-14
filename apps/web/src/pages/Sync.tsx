import { useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { toast } from 'react-hot-toast';

export function SyncPage() {
  const isSyncing = useRef(false);

  const syncMutation = useMutation({
    mutationFn: async () => {
      const requestId = crypto.randomUUID();
      console.log(`[SyncPage] sync clicked requestId=${requestId}`);
      
      // Chamada POST sem body, passando apenas o custom header
      return apiClient.post<{ upserted: number }>(
        '/v1/omie/sync/products', 
        undefined, 
        { 'X-Request-Id': requestId }
      );
    },
    onSuccess: (data) => {
      toast.success(`${data.upserted} produtos sincronizados com sucesso!`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao sincronizar produtos.');
    },
    onSettled: () => {
      // Libera o lock idependente de sucesso ou erro
      isSyncing.current = false;
    },
    retry: false, // Não tentar novamente em caso de falha de rede/API
  });

  const handleSync = () => {
    // Single flight lock: impede dezenas de cliques rápidos
    if (isSyncing.current || syncMutation.isPending) return;
    
    isSyncing.current = true;
    syncMutation.mutate();
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Sincronização Omie</h1>
      
      <p>Bem-vindo ao Gerenciador de Produção.</p>

      <div style={{ marginBottom: '2rem' }}>
        <button 
          onClick={handleSync} 
          disabled={syncMutation.isPending || isSyncing.current}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '1rem',
            cursor: (syncMutation.isPending || isSyncing.current) ? 'not-allowed' : 'pointer',
            backgroundColor: (syncMutation.isPending || isSyncing.current) ? '#ccc' : '#007bff',
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
          <li>
            <Link to="/orders" style={{ textDecoration: 'none', color: '#007bff' }}>
              🧾 Ordens
            </Link>
          </li>
          <li>
            <Link to="/omie/admin" style={{ textDecoration: 'none', color: '#007bff' }}>
              🛠️ OMIE Admin
            </Link>
          </li>
          <li>
            <Link to="/internal-production-orders" style={{ textDecoration: 'none', color: '#007bff' }}>
              🏭 OP Internas
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}
