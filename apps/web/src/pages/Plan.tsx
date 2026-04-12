import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { apiClient } from '../api/client';
import { useProducts } from '../hooks/api/useProducts';
import { usePlanDetails } from '../hooks/api/usePlanQueries';
import { useSectors } from '../hooks/api/useSectors';

type CalendarMode = 'day' | 'week' | 'month';

type DailyEntry = {
  id: string;
  productId: string;
  sectorId: string;
  quantity: number;
  note: string;
};

type CalendarData = Record<string, DailyEntry[]>;

type Segment = {
  key: string;
  label: string;
  dateKeys: string[];
};

type EntryEditor = {
  dateKey: string;
  entryId: string | null;
  productId: string;
  sectorId: string;
  quantity: string;
  note: string;
} | null;

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

function enumerateDateKeys(startValue: string | Date, endValue: string | Date) {
  const start = parseDateKey(toDateKey(startValue));
  const end = parseDateKey(toDateKey(endValue));
  const result: string[] = [];

  while (start <= end) {
    result.push(toDateKey(start));
    start.setDate(start.getDate() + 1);
  }

  return result;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getEasterSunday(year: number) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function buildHolidayMap(dateKeys: string[]) {
  const years = new Set(dateKeys.map((dateKey) => parseDateKey(dateKey).getFullYear()));
  const holidays = new Map<string, string>();

  const addHoliday = (date: Date, label: string) => {
    holidays.set(toDateKey(date), label);
  };

  for (const year of years) {
    addHoliday(new Date(year, 0, 1), 'Confraternização Universal');
    addHoliday(new Date(year, 3, 21), 'Tiradentes');
    addHoliday(new Date(year, 4, 1), 'Dia do Trabalho');
    addHoliday(new Date(year, 8, 7), 'Independência do Brasil');
    addHoliday(new Date(year, 9, 12), 'Nossa Senhora Aparecida');
    addHoliday(new Date(year, 10, 2), 'Finados');
    addHoliday(new Date(year, 10, 15), 'Proclamação da República');
    addHoliday(new Date(year, 11, 25), 'Natal');

    const easter = getEasterSunday(year);
    addHoliday(addDays(easter, -48), 'Carnaval');
    addHoliday(addDays(easter, -47), 'Carnaval');
    addHoliday(addDays(easter, -2), 'Sexta-feira Santa');
    addHoliday(addDays(easter, 60), 'Corpus Christi');
  }

  return holidays;
}

function getNonProductionReason(dateKey: string, holidayMap: Map<string, string>) {
  const date = parseDateKey(dateKey);
  const holiday = holidayMap.get(dateKey);

  if (holiday) {
    return holiday;
  }

  const day = date.getDay();
  if (day === 6) {
    return 'Sábado';
  }

  if (day === 0) {
    return 'Domingo';
  }

  return null;
}

function buildSegments(dateKeys: string[], mode: CalendarMode): Segment[] {
  if (mode === 'day') {
    return dateKeys.map((dateKey) => ({
      key: dateKey,
      label: parseDateKey(dateKey).toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
      }),
      dateKeys: [dateKey],
    }));
  }

  const grouped = new Map<string, string[]>();

  for (const dateKey of dateKeys) {
    const date = parseDateKey(dateKey);

    if (mode === 'week') {
      const day = date.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      date.setDate(date.getDate() + diff);
    } else {
      date.setDate(1);
    }

    const groupKey = toDateKey(date);
    const current = grouped.get(groupKey) ?? [];
    current.push(dateKey);
    grouped.set(groupKey, current);
  }

  return Array.from(grouped.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, values]) => ({
      key,
      label:
        mode === 'week'
          ? `${parseDateKey(values[0]).toLocaleDateString('pt-BR')} até ${parseDateKey(values[values.length - 1]).toLocaleDateString('pt-BR')}`
          : parseDateKey(key).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
      dateKeys: values,
    }));
}

function normalizeCalendarData(dateKeys: string[], storedData?: CalendarData) {
  const normalized: CalendarData = {};

  for (const dateKey of dateKeys) {
    const entries = storedData?.[dateKey];
    normalized[dateKey] = Array.isArray(entries)
      ? entries
          .filter((entry) => entry && typeof entry.productId === 'string')
          .map((entry) => ({
            id: entry.id,
            productId: entry.productId,
            sectorId: entry.sectorId ?? '',
            quantity: Number(entry.quantity) || 0,
            note: entry.note ?? '',
          }))
      : [];
  }

  return normalized;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getStockLabel(rawPayload: any) {
  const candidates = [
    rawPayload?.saldo_estoque,
    rawPayload?.saldo,
    rawPayload?.estoque_atual,
    rawPayload?.quantidade_estoque,
    rawPayload?.qtde_estoque,
    rawPayload?.estoque,
    rawPayload?.produto_estoque,
    rawPayload?.nSaldo,
  ];

  const stock = candidates.find((value) => value !== undefined && value !== null && value !== '');

  if (stock === undefined) {
    return 'Não informado';
  }

  return String(stock);
}

function getProductDefaultSectorId(product: any) {
  return product?.productSector?.sectorId ?? '';
}

export function PlanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: plan, isLoading: isLoadingPlan } = usePlanDetails(id!);
  const { data: productsData } = useProducts();
  const { data: sectorsData } = useSectors();

  const [calendarMode, setCalendarMode] = useState<CalendarMode>('month');
  const [selectedSegmentKey, setSelectedSegmentKey] = useState('');
  const [calendarData, setCalendarData] = useState<CalendarData>({});
  const [editor, setEditor] = useState<EntryEditor>(null);

  const dateKeys = useMemo(() => {
    if (!plan) {
      return [];
    }

    return enumerateDateKeys(plan.startDate, plan.endDate);
  }, [plan]);

  const storageKey = plan ? `production-plan-calendar:${plan.id}` : null;

  useEffect(() => {
    if (!storageKey) {
      return;
    }

    let storedData: CalendarData | undefined;

    try {
      const raw = window.localStorage.getItem(storageKey);
      storedData = raw ? (JSON.parse(raw) as CalendarData) : undefined;
    } catch {
      storedData = undefined;
    }

    setCalendarData(normalizeCalendarData(dateKeys, storedData));
  }, [dateKeys, storageKey]);

  useEffect(() => {
    if (!storageKey) {
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(calendarData));
  }, [calendarData, storageKey]);

  const products = productsData?.items ?? [];
  const sectors = sectorsData?.items ?? [];

  const productsById = useMemo(() => {
    return new Map(products.map((product) => [product.id, product]));
  }, [products]);

  const sectorsById = useMemo(() => {
    return new Map(sectors.map((sector) => [sector.id, sector]));
  }, [sectors]);

  const holidayMap = useMemo(() => buildHolidayMap(dateKeys), [dateKeys]);

  const segments = useMemo(() => buildSegments(dateKeys, calendarMode), [calendarMode, dateKeys]);

  useEffect(() => {
    if (segments.length === 0) {
      setSelectedSegmentKey('');
      return;
    }

    if (!segments.some((segment) => segment.key === selectedSegmentKey)) {
      setSelectedSegmentKey(segments[0].key);
    }
  }, [segments, selectedSegmentKey]);

  const selectedSegment = segments.find((segment) => segment.key === selectedSegmentKey) ?? segments[0];

  const visibleDateKeys = selectedSegment?.dateKeys ?? [];

  const totalEntries = useMemo(() => {
    return visibleDateKeys.reduce((sum, dateKey) => sum + (calendarData[dateKey]?.length ?? 0), 0);
  }, [calendarData, visibleDateKeys]);

  const totalQuantity = useMemo(() => {
    return visibleDateKeys.reduce(
      (sum, dateKey) =>
        sum + (calendarData[dateKey] ?? []).reduce((daySum, entry) => daySum + entry.quantity, 0),
      0
    );
  }, [calendarData, visibleDateKeys]);

  const openNewEntryForm = (dateKey: string) => {
    const nonProductionReason = getNonProductionReason(dateKey, holidayMap);
    if (nonProductionReason) {
      toast.error(`Não há produção em ${nonProductionReason.toLowerCase()}.`);
      return;
    }

    setEditor({
      dateKey,
      entryId: null,
      productId: '',
      sectorId: '',
      quantity: '1',
      note: '',
    });
  };

  const openEditEntryForm = (dateKey: string, entry: DailyEntry) => {
    setEditor({
      dateKey,
      entryId: entry.id,
      productId: entry.productId,
      sectorId: entry.sectorId,
      quantity: String(entry.quantity),
      note: entry.note,
    });
  };

  const closeEditor = () => {
    setEditor(null);
  };

  const saveEntry = () => {
    if (!editor) {
      return;
    }

    const quantity = Number(editor.quantity);
    const nonProductionReason = getNonProductionReason(editor.dateKey, holidayMap);

    if (nonProductionReason) {
      toast.error(`Não é permitido programar produção em ${nonProductionReason.toLowerCase()}.`);
      return;
    }

    if (!editor.productId || !editor.sectorId || !quantity || quantity <= 0) {
      toast.error('Escolha produto, setor e uma quantidade válida.');
      return;
    }

    setCalendarData((current) => {
      const dayEntries = [...(current[editor.dateKey] ?? [])];

      if (editor.entryId) {
        const index = dayEntries.findIndex((entry) => entry.id === editor.entryId);
        if (index >= 0) {
          dayEntries[index] = {
            ...dayEntries[index],
            productId: editor.productId,
            sectorId: editor.sectorId,
            quantity,
            note: editor.note,
          };
        }
      } else {
        dayEntries.push({
          id: crypto.randomUUID(),
          productId: editor.productId,
          sectorId: editor.sectorId,
          quantity,
          note: editor.note,
        });
      }

      return {
        ...current,
        [editor.dateKey]: dayEntries,
      };
    });

    toast.success(editor.entryId ? 'Item atualizado.' : 'Item adicionado.');
    closeEditor();
  };

  const removeEntry = (dateKey: string, entryId: string) => {
    setCalendarData((current) => ({
      ...current,
      [dateKey]: (current[dateKey] ?? []).filter((entry) => entry.id !== entryId),
    }));

    if (editor?.entryId === entryId) {
      closeEditor();
    }

    toast.success('Item removido.');
  };

  const handleExportCsv = async () => {
    try {
      const response = await fetch(`${apiClient.baseUrl}/v1/plans/${id}/export.csv`);
      if (!response.ok) {
        throw new Error('Falha ao exportar CSV');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `plano-${id}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(anchor);
    } catch (error: any) {
      toast.error(`Erro ao exportar: ${error.message}`);
    }
  };

  const handleExportPdf = () => {
    if (!plan || !selectedSegment) {
      return;
    }

    const printWindow = window.open('', '_blank', 'width=1400,height=900');

    if (!printWindow) {
      toast.error('Não foi possível abrir a janela para gerar o PDF.');
      return;
    }

    const sections = selectedSegment.dateKeys
      .map((dateKey) => {
        const nonProductionReason = getNonProductionReason(dateKey, holidayMap);
        const entries = calendarData[dateKey] ?? [];

        const groupedBySector = new Map<string, DailyEntry[]>();

        for (const entry of entries) {
          const current = groupedBySector.get(entry.sectorId) ?? [];
          current.push(entry);
          groupedBySector.set(entry.sectorId, current);
        }

        const content = nonProductionReason
          ? `<div style="padding: 12px 0; color: #b45309; font-weight: 700;">Sem produção: ${escapeHtml(nonProductionReason)}</div>`
          : Array.from(groupedBySector.entries())
              .map(([sectorId, sectorEntries]) => {
                const sectorName = sectorsById.get(sectorId)?.name ?? 'Sem setor';
                const rows = sectorEntries
                  .map((entry) => {
                    const product = productsById.get(entry.productId);
                    return `
                      <tr>
                        <td style="border: 1px solid #d0d7de; padding: 8px;">${escapeHtml(product?.omieProduct?.description ?? 'Produto removido')}</td>
                        <td style="border: 1px solid #d0d7de; padding: 8px; text-align: right;">${entry.quantity}</td>
                      </tr>
                    `;
                  })
                  .join('');

                return `
                  <div style="margin-top: 12px;">
                    <h3 style="margin: 0 0 8px;">${escapeHtml(sectorName)}</h3>
                    <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                      <thead>
                        <tr>
                          <th style="border: 1px solid #d0d7de; padding: 8px; text-align: left;">Produto</th>
                          <th style="border: 1px solid #d0d7de; padding: 8px; text-align: right;">Qtd.</th>
                        </tr>
                      </thead>
                      <tbody>${rows}</tbody>
                    </table>
                  </div>
                `;
              })
              .join('') || '<div style="padding: 12px 0; color: #64748b;">Sem itens neste dia.</div>';

        return `
          <section style="margin-top: 24px;">
            <h2 style="margin: 0 0 8px;">${parseDateKey(dateKey).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</h2>
            ${content}
          </section>
        `;
      })
      .join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>${escapeHtml(plan.name)}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #1f2328; }
            .cards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-top: 20px; }
            .card { border: 1px solid #d0d7de; border-radius: 10px; padding: 12px; }
            .label { font-size: 12px; color: #57606a; margin-bottom: 6px; }
            .value { font-size: 24px; font-weight: 700; }
          </style>
        </head>
        <body>
          <h1 style="margin: 0;">${escapeHtml(plan.name)}</h1>
          <div style="margin-top: 8px; color: #57606a;">
            Período ${new Date(plan.startDate).toLocaleDateString('pt-BR')} até ${new Date(plan.endDate).toLocaleDateString('pt-BR')}
          </div>
          <div class="cards">
            <div class="card"><div class="label">Modelo</div><div class="value">${calendarMode === 'day' ? 'Diário' : calendarMode === 'week' ? 'Semanal' : 'Mensal'}</div></div>
            <div class="card"><div class="label">Itens no período visível</div><div class="value">${totalEntries}</div></div>
            <div class="card"><div class="label">Quantidade total</div><div class="value">${totalQuantity}</div></div>
          </div>
          ${sections}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
    toast.success('Na janela de impressão, escolha Salvar como PDF.');
  };

  if (isLoadingPlan) {
    return <div style={{ padding: '2rem' }}>Carregando detalhes do plano...</div>;
  }

  if (!plan) {
    return <div style={{ padding: '2rem', color: 'red' }}>Plano não encontrado.</div>;
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div>
          <Link to="/plans" style={{ textDecoration: 'none', color: '#007bff', fontSize: '0.875rem' }}>
            &larr; Voltar para Planos
          </Link>
          <h1 style={{ margin: '0.5rem 0' }}>{plan.name}</h1>
          <p style={{ margin: 0, color: '#555' }}>
            Período: {new Date(plan.startDate).toLocaleDateString('pt-BR')} até {new Date(plan.endDate).toLocaleDateString('pt-BR')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleExportCsv}
            style={{
              padding: '0.65rem 1rem',
              backgroundColor: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Exportar CSV
          </button>
          <button
            onClick={handleExportPdf}
            style={{
              padding: '0.65rem 1rem',
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
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ border: '1px solid #d0d7de', borderRadius: '12px', padding: '1rem', backgroundColor: 'white' }}>
          <div style={{ color: '#57606a', fontSize: '0.875rem' }}>Dias no plano</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{dateKeys.length}</div>
        </div>
        <div style={{ border: '1px solid #d0d7de', borderRadius: '12px', padding: '1rem', backgroundColor: 'white' }}>
          <div style={{ color: '#57606a', fontSize: '0.875rem' }}>Itens visíveis</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{totalEntries}</div>
        </div>
        <div style={{ border: '1px solid #d0d7de', borderRadius: '12px', padding: '1rem', backgroundColor: 'white' }}>
          <div style={{ color: '#57606a', fontSize: '0.875rem' }}>Quantidade visível</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{totalQuantity}</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {(['day', 'week', 'month'] as CalendarMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setCalendarMode(mode)}
              style={{
                padding: '0.6rem 1rem',
                borderRadius: '999px',
                border: calendarMode === mode ? '1px solid #1d4ed8' : '1px solid #d0d7de',
                backgroundColor: calendarMode === mode ? '#dbeafe' : 'white',
                color: calendarMode === mode ? '#1d4ed8' : '#334155',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              {mode === 'day' ? 'Diário' : mode === 'week' ? 'Semanal' : 'Mensal'}
            </button>
          ))}
        </div>

        <select
          value={selectedSegment?.key ?? ''}
          onChange={(e) => setSelectedSegmentKey(e.target.value)}
          style={{ padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #d0d7de', minWidth: '280px' }}
        >
          {segments.map((segment) => (
            <option key={segment.key} value={segment.key}>
              {segment.label}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {visibleDateKeys.map((dateKey) => {
          const dayEntries = calendarData[dateKey] ?? [];
          const nonProductionReason = getNonProductionReason(dateKey, holidayMap);

          return (
            <section key={dateKey} style={{ border: '1px solid #d0d7de', borderRadius: '12px', overflow: 'hidden', backgroundColor: nonProductionReason ? '#f8fafc' : 'white' }}>
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0 }}>
                    {parseDateKey(dateKey).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                  </h3>
                  <div style={{ color: '#57606a', marginTop: '0.25rem' }}>
                    {nonProductionReason ? `Sem produção: ${nonProductionReason}` : `${dayEntries.length} item(ns) programado(s)`}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openNewEntryForm(dateKey)}
                  disabled={!!nonProductionReason}
                  style={{
                    padding: '0.55rem 0.9rem',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: nonProductionReason ? '#cbd5e1' : '#0f766e',
                    color: 'white',
                    cursor: nonProductionReason ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Adicionar produto
                </button>
              </div>

              <div style={{ padding: '1rem 1.25rem' }}>
                {editor?.dateKey === dateKey ? (
                  <div style={{ marginBottom: '1rem', padding: '1rem', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 2fr) 120px minmax(220px, 2fr) auto', gap: '0.75rem', alignItems: 'end' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem' }}>Produto</label>
                        <select
                          value={editor.productId}
                          onChange={(e) => {
                            const productId = e.target.value;
                            const product = productsById.get(productId);
                            setEditor({
                              ...editor,
                              productId,
                              sectorId: editor.sectorId || getProductDefaultSectorId(product),
                            });
                          }}
                          style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                        >
                          <option value="">Selecione um produto</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.omieProduct?.description} • estoque {getStockLabel(product.omieProduct?.rawPayload)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem' }}>Qtd.</label>
                        <input
                          type="number"
                          min="1"
                          value={editor.quantity}
                          onChange={(e) => setEditor({ ...editor, quantity: e.target.value })}
                          style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem' }}>Setor no plano</label>
                        <select
                          value={editor.sectorId}
                          onChange={(e) => setEditor({ ...editor, sectorId: e.target.value })}
                          style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                        >
                          <option value="">Selecione o setor</option>
                          {sectors.map((sector) => (
                            <option key={sector.id} value={sector.id}>
                              {sector.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem' }}>Observação</label>
                        <input
                          type="text"
                          value={editor.note}
                          onChange={(e) => setEditor({ ...editor, note: e.target.value })}
                          placeholder="Opcional"
                          style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                        />
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={saveEntry}
                          style={{
                            padding: '0.55rem 0.9rem',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: '#2563eb',
                            color: 'white',
                            cursor: 'pointer',
                            fontWeight: 600,
                          }}
                        >
                          Salvar
                        </button>
                        <button
                          type="button"
                          onClick={closeEditor}
                          style={{
                            padding: '0.55rem 0.9rem',
                            borderRadius: '8px',
                            border: '1px solid #d0d7de',
                            backgroundColor: 'white',
                            color: '#334155',
                            cursor: 'pointer',
                            fontWeight: 600,
                          }}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}

                {dayEntries.length === 0 ? (
                  <div style={{ color: '#64748b', fontStyle: 'italic' }}>
                    {nonProductionReason ? 'Dia bloqueado para produção.' : 'Nenhum produto programado para este dia.'}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {dayEntries.map((entry) => {
                      const product = productsById.get(entry.productId);
                      const sectorName = sectorsById.get(entry.sectorId)?.name ?? 'Sem setor';

                      return (
                        <article key={entry.id} style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.9rem 1rem', display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 700 }}>{product?.omieProduct?.description ?? 'Produto removido'}</div>
                            <div style={{ color: '#475569', marginTop: '0.2rem' }}>
                              Setor: {sectorName} • Estoque Omie: {getStockLabel(product?.omieProduct?.rawPayload)} • Quantidade planejada: {entry.quantity}
                            </div>
                            {entry.note ? <div style={{ color: '#64748b', marginTop: '0.2rem' }}>{entry.note}</div> : null}
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              onClick={() => openEditEntryForm(dateKey, entry)}
                              style={{
                                padding: '0.5rem 0.8rem',
                                borderRadius: '8px',
                                border: 'none',
                                backgroundColor: '#f59e0b',
                                color: 'white',
                                cursor: 'pointer',
                                fontWeight: 600,
                              }}
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => removeEntry(dateKey, entry.id)}
                              style={{
                                padding: '0.5rem 0.8rem',
                                borderRadius: '8px',
                                border: 'none',
                                backgroundColor: '#dc2626',
                                color: 'white',
                                cursor: 'pointer',
                                fontWeight: 600,
                              }}
                            >
                              Excluir
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
