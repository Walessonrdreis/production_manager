import type { DailyEntry } from '../../../domain/plans/types';
import { EntryRow } from './EntryRow';

type ProductLite = {
  id: string;
  description?: string | null;
  nickname?: string | null;
  omieProduct?: { description?: string | null } | null;
};
type SectorLite = { id: string; name?: string | null };

type Props = {
  entries: DailyEntry[];
  productsById: Map<string, ProductLite>;
  sectorsById: Map<string, SectorLite>;

  onEdit: (entry: DailyEntry) => void;
  onRemove: (entryId: string) => void;
};

export function EntryList({ entries, productsById, sectorsById, onEdit, onRemove }: Props) {
  if (entries.length === 0) {
    return <div style={{ opacity: 0.7, fontSize: 12 }}>Nenhum item para este dia.</div>;
  }

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {entries.map((entry) => (
        <EntryRow
          key={entry.id}
          entry={entry}
          product={productsById.get(entry.productId)}
          sector={sectorsById.get(entry.sectorId)}
          onEdit={onEdit}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}
