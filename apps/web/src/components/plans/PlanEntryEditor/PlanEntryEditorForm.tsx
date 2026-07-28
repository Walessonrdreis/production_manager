type Option = { value: string; label: string };

type Props = {
  productOptions: Option[];
  sectorOptions: Option[];

  productId: string;
  sectorId: string;
  quantity: string;
  note: string;

  onChangeProductId: (value: string) => void;
  onChangeSectorId: (value: string) => void;
  onChangeQuantity: (value: string) => void;
  onChangeNote: (value: string) => void;

  onSave: () => void;
  onCancel: () => void;

  isEditing?: boolean;
};

export function PlanEntryEditorForm({
  productOptions,
  sectorOptions,
  productId,
  sectorId,
  quantity,
  note,
  onChangeProductId,
  onChangeSectorId,
  onChangeQuantity,
  onChangeNote,
  onSave,
  onCancel,
  isEditing,
}: Props) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
      style={{ display: 'grid', gap: 10 }}
    >
      <label style={{ display: 'grid', gap: 6 }}>
        <span style={{ fontSize: 12, opacity: 0.8 }}>Produto</span>
        <select value={productId} onChange={(e) => onChangeProductId(e.target.value)}>
          <option value="">Selecione...</option>
          {productOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      <label style={{ display: 'grid', gap: 6 }}>
        <span style={{ fontSize: 12, opacity: 0.8 }}>Setor</span>
        <select value={sectorId} onChange={(e) => onChangeSectorId(e.target.value)}>
          <option value="">Selecione...</option>
          {sectorOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      <label style={{ display: 'grid', gap: 6 }}>
        <span style={{ fontSize: 12, opacity: 0.8 }}>Quantidade</span>
        <input
          value={quantity}
          onChange={(e) => onChangeQuantity(e.target.value)}
          inputMode="numeric"
          placeholder="1"
        />
      </label>

      <label style={{ display: 'grid', gap: 6 }}>
        <span style={{ fontSize: 12, opacity: 0.8 }}>Observação</span>
        <textarea value={note} onChange={(e) => onChangeNote(e.target.value)} rows={3} />
      </label>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit">{isEditing ? 'Salvar alterações' : 'Adicionar'}</button>
      </div>
    </form>
  );
}