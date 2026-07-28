import type { DailyEntry } from '../../../domain/plans/types';
import { parseDateKey } from '../../../domain/plans/calendar';
import { getNonProductionReason } from '../../../domain/plans/holidays';
import { EntryList } from './EntryList';

type ProductLite = {
  id: string;
  description?: string | null;
  nickname?: string | null;
  omieProduct?: { description?: string | null } | null;
};
type SectorLite = { id: string; name?: string | null };

type Props = {
  dateKey: string;
  entries: DailyEntry[];
  holidayMap: Map<string, string>;

  productsById: Map<string, ProductLite>;
  sectorsById: Map<string, SectorLite>;

  onAdd: (dateKey: string) => void;
  onEdit: (dateKey: string, entry: DailyEntry) => void;
  onRemove: (dateKey: string, entryId: string) => void;
};

export function DayColumn({
  dateKey,
  entries,
  holidayMap,
  productsById,
  sectorsById,
  onAdd,
  onEdit,
  onRemove,
}: Props) {
  const date = parseDateKey(dateKey);
  const label = date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
  const nonProductionReason = getNonProductionReason(dateKey, holidayMap);

  return (
    <div
      style={{
        padding: 12,
        border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: 10,
        background: nonProductionReason ? 'rgba(0,0,0,0.02)' : 'white',
        display: 'grid',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
        <div>
          <strong>{label}</strong>
          {nonProductionReason ? (
            <div style={{ fontSize: 12, opacity: 0.7 }}>Sem produção: {nonProductionReason}</div>
          ) : (
            <div style={{ fontSize: 12, opacity: 0.7 }}>Produção liberada</div>
          )}
        </div>

        <button type="button" onClick={() => onAdd(dateKey)} disabled={!!nonProductionReason}>
          + Adicionar
        </button>
      </div>

      <EntryList
        entries={entries}
        productsById={productsById}
        sectorsById={sectorsById}
        onEdit={(entry) => onEdit(dateKey, entry)}
        onRemove={(entryId) => onRemove(dateKey, entryId)}
      />
    </div>
  );
}
