import type { CalendarData, DailyEntry } from '../../../domain/plans/types';
import { DayColumn } from './DayColumn';

type ProductLite = {
  id: string;
  description?: string | null;
  nickname?: string | null;
  omieProduct?: { description?: string | null } | null;
};
type SectorLite = { id: string; name?: string | null };

type Props = {
  visibleDateKeys: string[];
  calendarData: CalendarData;
  holidayMap: Map<string, string>;

  productsById: Map<string, ProductLite>;
  sectorsById: Map<string, SectorLite>;

  onAddEntry: (dateKey: string) => void;
  onEditEntry: (dateKey: string, entry: DailyEntry) => void;
  onRemoveEntry: (dateKey: string, entryId: string) => void;

  isLoading?: boolean;
};

export function PlanCalendar({
  visibleDateKeys,
  calendarData,
  holidayMap,
  productsById,
  sectorsById,
  onAddEntry,
  onEditEntry,
  onRemoveEntry,
  isLoading,
}: Props) {
  if (isLoading) {
    return <div style={{ opacity: 0.7 }}>Carregando calendário...</div>;
  }

  if (!visibleDateKeys || visibleDateKeys.length === 0) {
    return <div style={{ opacity: 0.7 }}>Nenhum dia disponível.</div>;
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {visibleDateKeys.map((dateKey) => (
        <DayColumn
          key={dateKey}
          dateKey={dateKey}
          entries={calendarData[dateKey] ?? []}
          holidayMap={holidayMap}
          productsById={productsById}
          sectorsById={sectorsById}
          onAdd={onAddEntry}
          onEdit={onEditEntry}
          onRemove={onRemoveEntry}
        />
      ))}
    </div>
  );
}
