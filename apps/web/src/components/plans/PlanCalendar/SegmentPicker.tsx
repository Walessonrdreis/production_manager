import type { CalendarMode, Segment } from '../../../domain/plans/types';

type Props = {
  calendarMode: CalendarMode;
  onModeChange: (mode: CalendarMode) => void;

  segments: Segment[];
  selectedSegmentKey: string;
  onSegmentChange: (key: string) => void;
};

export function SegmentPicker({
  calendarMode,
  onModeChange,
  segments,
  selectedSegmentKey,
  onSegmentChange,
}: Props) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
      <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <span style={{ fontSize: 12, opacity: 0.8 }}>Modo</span>
        <select value={calendarMode} onChange={(e) => onModeChange(e.target.value as CalendarMode)}>
          <option value="day">Dia</option>
          <option value="week">Semana</option>
          <option value="month">Mês</option>
        </select>
      </label>

      <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <span style={{ fontSize: 12, opacity: 0.8 }}>Segmento</span>
        <select value={selectedSegmentKey} onChange={(e) => onSegmentChange(e.target.value)}>
          {segments.map((segment) => (
            <option key={segment.key} value={segment.key}>
              {segment.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}