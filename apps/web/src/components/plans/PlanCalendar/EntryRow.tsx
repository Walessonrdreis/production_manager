import type { DailyEntry } from '../../../domain/plans/types';

type ProductLite = {
  id: string;
  description?: string | null;
  nickname?: string | null;
  omieProduct?: { description?: string | null } | null;
};
type SectorLite = { id: string; name?: string | null };

type Props = {
  entry: DailyEntry;
  product?: ProductLite;
  sector?: SectorLite;

  onEdit: (entry: DailyEntry) => void;
  onRemove: (entryId: string) => void;
};

export function EntryRow({ entry, product, sector, onEdit, onRemove }: Props) {
  const productLabel =
    product?.nickname ??
    product?.omieProduct?.description ??
    product?.description ??
    entry.productId;

  const sectorLabel = sector?.name ?? entry.sectorId;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: 8,
        padding: '8px 10px',
        border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: 8,
      }}
    >
      <div style={{ display: 'grid', gap: 2 }}>
        <strong style={{ fontSize: 13 }}>{productLabel}</strong>
        <small style={{ opacity: 0.7 }}>
          Setor: {sectorLabel} • Qtd: {entry.quantity}
        </small>
        {entry.note ? <small style={{ opacity: 0.75 }}>Obs: {entry.note}</small> : null}
      </div>

      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <button type="button" onClick={() => onEdit(entry)}>
          Editar
        </button>
        <button type="button" onClick={() => onRemove(entry.id)}>
          Remover
        </button>
      </div>
    </div>
  );
}
