import type { EntryEditor } from '../../../domain/plans/types';
import { PlanEntryEditorForm } from './PlanEntryEditorForm';

type Option = { value: string; label: string };

type Props = {
  editor: EntryEditor; // null = fechado
  title?: string;

  productOptions: Option[];
  sectorOptions: Option[];

  /** Opcional: retorna o setor padrão de um produto (para preencher automaticamente) */
  getDefaultSectorId?: (productId: string) => string;

  onChange: (next: NonNullable<EntryEditor>) => void;

  onSave: () => void;
  onClose: () => void;
};

export function PlanEntryEditorModal({
  editor,
  title,
  productOptions,
  sectorOptions,
  getDefaultSectorId,
  onChange,
  onSave,
  onClose,
}: Props) {
  if (!editor) return null;

  const isEditing = !!editor.entryId;

  const onChangeProductId = (productId: string) => {
    const sectorDefault = getDefaultSectorId?.(productId) ?? '';
    onChange({
      ...editor,
      productId,
      sectorId: editor.sectorId || sectorDefault,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.35)',
        display: 'grid',
        placeItems: 'center',
        padding: 16,
        zIndex: 50,
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div style={{ width: 'min(520px, 100%)', background: 'white', borderRadius: 12, padding: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <strong>{title ?? (isEditing ? 'Editar item' : 'Adicionar item')}</strong>
          <button type="button" onClick={onClose}>
            X
          </button>
        </div>

        <PlanEntryEditorForm
          productOptions={productOptions}
          sectorOptions={sectorOptions}
          productId={editor.productId}
          sectorId={editor.sectorId}
          quantity={editor.quantity}
          note={editor.note}
          onChangeProductId={onChangeProductId}
          onChangeSectorId={(v) => onChange({ ...editor, sectorId: v })}
          onChangeQuantity={(v) => onChange({ ...editor, quantity: v })}
          onChangeNote={(v) => onChange({ ...editor, note: v })}
          onSave={onSave}
          onCancel={onClose}
          isEditing={isEditing}
        />
      </div>
    </div>
  );
}