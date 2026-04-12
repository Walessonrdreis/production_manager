import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { apiClient } from '../api/client';
import { usePlans } from '../hooks/api/usePlans';
import { ProductionPlan } from '@shared/contracts';

type PlanMode = 'day' | 'week' | 'month';

type PlanCard = ProductionPlan & {
  totalDays: number;
  modelLabel: string;
  periodLabel: string;
};

function pad(value: number) {
  return value.toString().padStart(2, '0');
}

function toDateKey(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseDateKey(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function countDays(startValue: string | Date, endValue: string | Date) {
  const start = parseDateKey(toDateKey(startValue));
  const end = parseDateKey(toDateKey(endValue));
  const diff = end.getTime() - start.getTime();
  return Math.floor(diff / (24 * 60 * 60 * 1000)) + 1;
}

function getModelLabel(totalDays: number) {
  if (totalDays <= 1) {
    return 'Diário';
  }

  if (totalDays <= 7) {
    return 'Semanal';
  }

  return 'Mensal';
}

function getEndDateByMode(startValue: string, mode: PlanMode) {
  const start = parseDateKey(startValue);

  if (mode === 'day') {
    return toDateKey(start);
  }

  if (mode === 'week') {
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return toDateKey(end);
  }

  const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
  return toDateKey(end);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function PlansPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [mode, setMode] = useState<PlanMode>('month');

  const { data, isLoading, isError } = usePlans();

  const createMutation = useMutation({
    mutationFn: (newPlan: { name: string; startDate: string; endDate: string }) =>
      apiClient.post<{ id: string }>('/v1/plans', newPlan),
    onSuccess: (createdPlan) => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      navigate(`/plans/${createdPlan.id}`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Não foi possível criar o plano.');
    },
  });

  const plans = useMemo<PlanCard[]>(() => {
    return (data?.items || []).map((plan) => {
      const totalDays = countDays(plan.startDate, plan.endDate);

      return {
        ...plan,
        totalDays,
        modelLabel: getModelLabel(totalDays),
        periodLabel: `${new Date(plan.startDate).toLocaleDateString('pt-BR')} até ${new Date(plan.endDate).toLocaleDateString('pt-BR')}`,
      };
    });
  }, [data?.items]);

  const planPreview = useMemo(() => {
    if (!startDate || !endDate) {
      return 'Selecione a data inicial para montar o período.';
    }

    return `${new Date(`${startDate}T12:00:00`).toLocaleDateString('pt-BR')} até ${new Date(`${endDate}T12:00:00`).toLocaleDateString('pt-BR')}`;
  }, [endDate, startDate]);

  const handleStartDateChange = (value: string) => {
    setStartDate(value);

    if (!value) {
      setEndDate('');
      return;
    }

    setEndDate(getEndDateByMode(value, mode));
  };

  const handleModeChange = (value: PlanMode) => {
    setMode(value);

    if (startDate) {
      setEndDate(getEndDateByMode(startDate, value));
    }
  };

  const handleCreate = (event: React.FormEvent) => {
    event.preventDefault();

    if (!name || !startDate || !endDate) {
      toast.error('Preencha nome, modelo e data inicial.');
      return;
    }

    createMutation.mutate({
      name,
      startDate: new Date(`${startDate}T08:00:00`).toISOString(),
      endDate: new Date(`${endDate}T18:00:00`).toISOString(),
    });
  };

  const handleExportPdf = () => {
    const printWindow = window.open('', '_blank', 'width=1200,height=900');

    if (!printWindow) {
      toast.error('Não foi possível abrir a janela para gerar o PDF.');
      return;
    }

    const rows = plans
      .map(
        (plan) => `
          <tr>
            <td style="border: 1px solid #d0d7de; padding: 8px;">${escapeHtml(plan.name)}</td>
            <td style="border: 1px solid #d0d7de; padding: 8px;">${escapeHtml(plan.modelLabel)}</td>
            <td style="border: 1px solid #d0d7de; padding: 8px;">${escapeHtml(plan.periodLabel)}</td>
            <td style="border: 1px solid #d0d7de; padding: 8px; text-align: right;">${plan.totalDays}</td>
            <td style="border: 1px solid #d0d7de; padding: 8px;">${plan.status}</td>
          </tr>
        `
      )
      .join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Planos de produção</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #1f2328; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 20px; }
            .cards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-top: 20px; }
            .card { border: 1px solid #d0d7de; border-radius: 10px; padding: 12px; }
            .label { font-size: 12px; color: #57606a; margin-bottom: 6px; }
            .value { font-size: 24px; font-weight: 700; }
          </style>
        </head>
        <body>
          <h1 style="margin: 0;">Planos de produção</h1>
          <div style="margin-top: 8px; color: #57606a;">Gerado em ${new Date().toLocaleString('pt-BR')}</div>
          <div class="cards">
            <div class="card"><div class="label">Total de planos</div><div class="value">${plans.length}</div></div>
            <div class="card"><div class="label">Planos diários</div><div class="value">${plans.filter((plan) => plan.modelLabel === 'Diário').length}</div></div>
            <div class="card"><div class="label">Planos semanais ou mensais</div><div class="value">${plans.filter((plan) => plan.modelLabel !== 'Diário').length}</div></div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="border: 1px solid #d0d7de; padding: 8px; text-align: left;">Plano</th>
                <th style="border: 1px solid #d0d7de; padding: 8px; text-align: left;">Modelo</th>
                <th style="border: 1px solid #d0d7de; padding: 8px; text-align: left;">Período</th>
                <th style="border: 1px solid #d0d7de; padding: 8px; text-align: right;">Dias</th>
                <th style="border: 1px solid #d0d7de; padding: 8px; text-align: left;">Status</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
    toast.success('Na janela de impressão, escolha Salvar como PDF.');
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0 }}>Planos de Produção</h1>
          <p style={{ margin: '0.5rem 0 0', color: '#57606a' }}>
            Crie um plano diário, semanal ou mensal e depois monte o calendário de produção por dia.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleExportPdf}
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#6f42c1',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Gerar PDF
          </button>
          <Link
            to="/"
            style={{
              textDecoration: 'none',
              color: '#007bff',
              padding: '0.75rem 1rem',
              backgroundColor: '#eef6ff',
              borderRadius: '8px',
              fontWeight: 600,
            }}
          >
            Voltar para Home
          </Link>
        </div>
      </div>

      <form onSubmit={handleCreate} style={{ marginBottom: '2rem', padding: '1.25rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ margin: 0 }}>Criar Novo Plano</h3>
            <p style={{ margin: '0.35rem 0 0', color: '#57606a' }}>
              O calendário será montado automaticamente com base no período escolhido.
            </p>
          </div>
          <div style={{ padding: '0.75rem 1rem', backgroundColor: 'white', borderRadius: '10px', border: '1px solid #d0d7de', color: '#334155', fontWeight: 600 }}>
            {planPreview}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ minWidth: '260px', flex: '1 1 260px' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem' }}>Nome do Plano</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Produção Semana 1"
              required
              style={{ padding: '0.5rem', width: '100%', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>

          <div style={{ minWidth: '180px' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem' }}>Modelo</label>
            <select
              value={mode}
              onChange={(e) => handleModeChange(e.target.value as PlanMode)}
              style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', width: '100%' }}
            >
              <option value="day">Diário</option>
              <option value="week">Semanal</option>
              <option value="month">Mensal</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem' }}>Data de Início</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
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

      {isLoading ? (
        <p>Carregando planos...</p>
      ) : isError ? (
        <p style={{ color: 'red' }}>Erro ao carregar a lista de planos.</p>
      ) : plans.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', border: '1px dashed #cbd5e1', borderRadius: '12px', backgroundColor: '#fff' }}>
          Nenhum plano cadastrado ainda.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          {plans.map((plan) => (
            <article key={plan.id} style={{ border: '1px solid #d0d7de', borderRadius: '12px', padding: '1rem', backgroundColor: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.75rem' }}>
                <strong>{plan.name}</strong>
                <span style={{
                  padding: '0.25rem 0.5rem',
                  borderRadius: '999px',
                  backgroundColor: '#eef6ff',
                  color: '#1d4ed8',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  height: 'fit-content',
                }}>
                  {plan.modelLabel}
                </span>
              </div>
              <div style={{ color: '#475569', marginBottom: '0.35rem' }}>{plan.periodLabel}</div>
              <div style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '0.75rem' }}>{plan.totalDays} dia(s)</div>
              <div style={{ marginBottom: '1rem' }}>
                <span style={{
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  backgroundColor: plan.status === 'DRAFT' ? '#fff3cd' : '#e2e3e5',
                  color: plan.status === 'DRAFT' ? '#856404' : '#383d41',
                  fontSize: '0.875rem',
                }}>
                  {plan.status}
                </span>
              </div>
              <Link
                to={`/plans/${plan.id}`}
                style={{
                  display: 'inline-block',
                  padding: '0.5rem 0.9rem',
                  backgroundColor: '#0f766e',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                }}
              >
                Abrir calendário
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
