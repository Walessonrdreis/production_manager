import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSectors } from '../hooks/api/useSectors';
import { useCreateSector, useUpdateSector, useDeleteSector } from '../hooks/api/useSectorMutations';

export function SectorsPage() {
  const [newSectorName, setNewSectorName] = useState('');
  const [newSectorOrder, setNewSectorOrder] = useState<number | ''>('');

  const { data, isLoading, isError } = useSectors(true);

  const createMutation = useCreateSector();
  const updateMutation = useUpdateSector();
  const deleteMutation = useDeleteSector();

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectorName.trim()) return;
    
    createMutation.mutate(
      {
        name: newSectorName.trim(),
        order: newSectorOrder === '' ? 0 : Number(newSectorOrder),
      },
      {
        onSuccess: () => {
          setNewSectorName('');
          setNewSectorOrder('');
        },
      }
    );
  };

  const sectors = data?.items || [];

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Setores de Produção</h1>
        <Link to="/" style={{ textDecoration: 'none', color: '#007bff' }}>
          Voltar para Home
        </Link>
      </div>

      {/* Formulário de Criação */}
      <form onSubmit={handleCreate} style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
        <h3>Adicionar Novo Setor</h3>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem' }}>Nome do Setor</label>
            <input
              type="text"
              value={newSectorName}
              onChange={(e) => setNewSectorName(e.target.value)}
              placeholder="Ex: Corte"
              required
              style={{ padding: '0.5rem', width: '250px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem' }}>Ordem</label>
            <input
              type="number"
              value={newSectorOrder}
              onChange={(e) => setNewSectorOrder(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="Ex: 10"
              style={{ padding: '0.5rem', width: '100px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>
          <button
            type="submit"
            disabled={createMutation.isPending || !newSectorName.trim()}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: createMutation.isPending ? 'not-allowed' : 'pointer',
            }}
          >
            {createMutation.isPending ? 'Adicionando...' : 'Adicionar'}
          </button>
        </div>
      </form>

      {/* Tabela de Setores */}
      {isLoading ? (
        <p>Carregando setores...</p>
      ) : isError ? (
        <p style={{ color: 'red' }}>Erro ao carregar a lista de setores.</p>
      ) : (
        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '760px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem', border: '1px solid #ddd' }}>Ordem</th>
                <th style={{ padding: '0.75rem', border: '1px solid #ddd' }}>Nome do Setor</th>
                <th style={{ padding: '0.75rem', border: '1px solid #ddd' }}>Status (Ativo)</th>
                <th style={{ padding: '0.75rem', border: '1px solid #ddd', width: '150px' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {sectors.map((sector) => (
                <tr key={sector.id} style={{ opacity: sector.active ? 1 : 0.6 }}>
                  <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>
                    <input
                      type="number"
                      defaultValue={sector.order}
                      onBlur={(e) => {
                        const newOrder = Number(e.target.value);
                        if (newOrder !== sector.order) {
                          updateMutation.mutate({ id: sector.id, payload: { order: newOrder } });
                        }
                      }}
                      style={{ padding: '0.4rem', width: '60px', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                  </td>
                  <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>
                    {sector.name}
                  </td>
                  <td style={{ padding: '0.75rem', border: '1px solid #ddd', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={sector.active}
                      onChange={(e) => {
                        updateMutation.mutate({ id: sector.id, payload: { active: e.target.checked } });
                      }}
                      style={{ transform: 'scale(1.5)', cursor: 'pointer' }}
                    />
                  </td>
                  <td style={{ padding: '0.75rem', border: '1px solid #ddd', textAlign: 'center' }}>
                    <button
                      onClick={() => {
                        if (window.confirm(`Tem certeza que deseja inativar o setor "${sector.name}"?`)) {
                          deleteMutation.mutate(sector.id);
                        }
                      }}
                      disabled={!sector.active || deleteMutation.isPending}
                      style={{
                        padding: '0.4rem 0.8rem',
                        backgroundColor: sector.active ? '#dc3545' : '#ccc',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: sector.active ? 'pointer' : 'not-allowed',
                      }}
                    >
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
              {sectors.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: '1rem', textAlign: 'center', border: '1px solid #ddd' }}>
                    Nenhum setor cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
