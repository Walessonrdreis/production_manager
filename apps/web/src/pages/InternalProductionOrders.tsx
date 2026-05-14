import { toast } from 'react-hot-toast';
import {
  useInternalProductionOrders,
  useStartInternalProductionOrder,
  useCompleteInternalProductionOrder,
} from '../hooks/api/useInternalProductionOrders';
import { InternalProductionOrdersTable } from '../components/internal-production-orders/InternalProductionOrdersTable';

export function InternalProductionOrdersPage() {
  const { data, isLoading, isError } = useInternalProductionOrders();

  const startMutation = useStartInternalProductionOrder();
  const completeMutation = useCompleteInternalProductionOrder();

  const handleStart = (id: string) => {
    startMutation.mutate(
      { id },
      {
        onSuccess: () => toast.success('OP iniciada com sucesso'),
        onError: (err: any) => toast.error(err.message || 'Erro ao iniciar OP'),
      },
    );
  };

  const handleComplete = (id: string) => {
    completeMutation.mutate(
      { id },
      {
        onSuccess: () => toast.success('OP concluída com sucesso'),
        onError: (err: any) => toast.error(err.message || 'Erro ao concluir OP'),
      },
    );
  };

  const isStarting = startMutation.isPending;
  const isCompleting = completeMutation.isPending;

  const orders = data?.items || [];

  return (
    <div
      style={{
        padding: '2rem',
        fontFamily: 'sans-serif',
        maxWidth: '1400px',
        margin: '0 auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>Ordens de Produção Internas</h1>
          <p style={{ color: '#6b7280', margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>
            {data ? `${data.total} ordem(ns) encontrada(s)` : 'Carregando...'}
          </p>
        </div>
      </div>

      {isLoading ? (
        <p>Carregando ordens de produção...</p>
      ) : isError ? (
        <p style={{ color: 'red' }}>Erro ao carregar ordens de produção.</p>
      ) : (
        <InternalProductionOrdersTable
          orders={orders}
          onStart={handleStart}
          onComplete={handleComplete}
          isStarting={isStarting}
          isCompleting={isCompleting}
        />
      )}
    </div>
  );
}
