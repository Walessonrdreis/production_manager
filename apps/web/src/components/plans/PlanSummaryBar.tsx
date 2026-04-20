import type { CalendarMode, Segment } from '../../domain/plans/types';

type Props = {
  planName?: string;
  calendarMode: CalendarMode;
  onModeChange: (mode: CalendarMode) => void;

  segments: Segment[];
  selectedSegmentKey: string;
  onSegmentChange: (key: string) => void;

  totalEntries: number;
  totalQuantity: number;

  isLoading?: boolean;
};

export function PlanSummaryBar({
  planName,
  calendarMode,
  onModeChange,
  segments,
  selectedSegmentKey,
  onSegmentChange,
  totalEntries,
  totalQuantity,
  isLoading,
}: Props) {
  return (
    <div className="PlanSummaryBar" style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0 }}>{planName ?? 'Plano'}</h2>
          <small style={{ opacity: 0.7 }}>
            {isLoading ? 'Carregando...' : `${totalEntries} itens • Quantidade total: ${totalQuantity}`}
          </small>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 12, opacity: 0.8 }}>Modo</span>
            <select value={calendarMode} onChange={(e) => onModeChange(e.target.value as CalendarMode)}>
              <option value="day">Dia</option>
              <option value="week">Semana</option>
              <option value="month">Mês</option>
            </select>
          </label>

          <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 12, opacity: 0.8 }}>Período</span>
            <select value={selectedSegmentKey} onChange={(e) => onSegmentChange(e.target.value)}>
              {segments.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </div>
  );
}