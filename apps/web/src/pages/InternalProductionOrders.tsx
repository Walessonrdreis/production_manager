import { useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  useInternalProductionOrders,
  useStartInternalProductionOrder,
  useCompleteInternalProductionOrder,
  useCreateInternalProductionOrder,
  useUpdateInternalProductionOrder,
  useDeleteInternalProductionOrder,
} from '../hooks/api/useInternalProductionOrders';
import type { InternalProductionOrder } from '../hooks/api/useInternalProductionOrders';
import { InternalProductionOrdersTable } from '../components/internal-production-orders/InternalProductionOrdersTable';
import { InternalProductionOrderFormModal } from '../components/internal-production-orders/InternalProductionOrderFormModal';
import { Modal } from '../components/ui/Modal';

export function InternalProductionOrdersPage() {
  const { data, isLoading, isError } = useInternalProductionOrders();

  const startMutation = useStartInternalProductionOrder();
  const completeMutation = useCompleteInternalProductionOrder();
  const createMutation = useCreateInternalProductionOrder();
  const updateMutation = useUpdateInternalProductionOrder();
  const deleteMutation = useDeleteInternalProductionOrder();

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<InternalProductionOrder | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InternalProductionOrder | null>(null);

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

  const handleOpenCreate = () => {
    setEditingOrder(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (order: InternalProductionOrder) => {
    setEditingOrder(order);
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = (data: any) => {
    if (editingOrder) {
      updateMutation.mutate(
        { id: editingOrder.id, data },
        {
          onSuccess: () => {
            toast.success('OP atualizada com sucesso');
            setIsFormModalOpen(false);
            setEditingOrder(null);
          },
          onError: (err: any) => toast.error(err.message || 'Erro ao atualizar OP'),
        },
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          toast.success('OP criada com sucesso');
          setIsFormModalOpen(false);
        },
        onError: (err: any) => toast.error(err.message || 'Erro ao criar OP'),
      });
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success('OP excluída com sucesso');
        setDeleteTarget(null);
      },
      onError: (err: any) => toast.error(err.message || 'Erro ao excluir OP'),
    });
  };

  const isStarting = startMutation.isPending;
  const isCompleting = completeMutation.isPending;
  const isFormSubmitting = createMutation.isPending || updateMutation.isPending;
  const isDeleting = deleteMutation.isPending;

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

        <button
          onClick={handleOpenCreate}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          + Nova OP
        </button>
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
          onEdit={handleOpenEdit}
          onDelete={(id) => {
            const order = orders.find((o) => o.id === id);
            if (order) setDeleteTarget(order);
          }}
          isStarting={isStarting}
          isCompleting={isCompleting}
        />
      )}

      <InternalProductionOrderFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingOrder(null);
        }}
        onSubmit={handleFormSubmit}
        isSubmitting={isFormSubmitting}
        editingOrder={editingOrder}
      />

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Confirmar exclusão"
      >
        <p style={{ color: '#374151', marginBottom: '1rem' }}>
          Tem certeza que deseja excluir a OP <strong>{deleteTarget?.title}</strong> (lote{' '}
          <strong>{deleteTarget?.lote}</strong>)? Esta ação não pode ser desfeita.
        </p>

        {deleteTarget?.startedAt && !deleteTarget?.completedAt && (
          <p style={{ color: '#d97706', fontSize: '0.875rem', marginBottom: '1rem' }}>
            Atenção: esta OP já foi iniciada.
          </p>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button
            onClick={() => setDeleteTarget(null)}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              backgroundColor: '#f3f4f6',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmDelete}
            disabled={isDeleting}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              opacity: isDeleting ? 0.6 : 1,
            }}
          >
            {isDeleting ? 'Excluindo...' : 'Excluir'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
