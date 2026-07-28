import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import type {
  InternalProductionOrder,
  CreateInternalProductionOrderInput,
  UpdateInternalProductionOrderInput,
} from '../../hooks/api/useInternalProductionOrders';

const UNITS = ['UN', 'B', 'G', 'KG'] as const;

type Props = {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateInternalProductionOrderInput | UpdateInternalProductionOrderInput) => void
  isSubmitting: boolean
  editingOrder: InternalProductionOrder | null
}

const inputClass =
  'w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500';
const labelClass = 'block text-sm font-medium text-zinc-700 mb-1';
const rowClass = 'flex gap-4';

type FormState = {
  title: string
  lote: string
  quantityValue: string
  quantityUnit: 'UN' | 'B' | 'G' | 'KG'
  source: 'MANUAL' | 'TRELLO'
  omieCode: string
  parsedProductName: string
  productDescription: string
  stockQuantity: string
  minimumStock: string
}

const emptyForm: FormState = {
  title: '',
  lote: '',
  quantityValue: '',
  quantityUnit: 'UN',
  source: 'MANUAL',
  omieCode: '',
  parsedProductName: '',
  productDescription: '',
  stockQuantity: '',
  minimumStock: '',
};

function orderToForm(order: InternalProductionOrder): FormState {
  return {
    title: order.title,
    lote: order.lote,
    quantityValue: String(order.quantityValue),
    quantityUnit: order.quantityUnit,
    source: order.source,
    omieCode: order.omieCode ?? '',
    parsedProductName: order.parsedProductName ?? '',
    productDescription: order.productDescription ?? '',
    stockQuantity: order.stockQuantity !== null ? String(order.stockQuantity) : '',
    minimumStock: order.minimumStock !== null ? String(order.minimumStock) : '',
  };
}

export function InternalProductionOrderFormModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  editingOrder,
}: Props) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const isEditing = !!editingOrder;

  useEffect(() => {
    if (editingOrder) {
      setForm(orderToForm(editingOrder));
    } else {
      setForm(emptyForm);
    }
  }, [editingOrder, isOpen]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (isEditing && editingOrder) {
      const data: UpdateInternalProductionOrderInput = {
        title: form.title || undefined,
        lote: form.lote || undefined,
        quantityValue: form.quantityValue ? Number(form.quantityValue) : undefined,
        quantityUnit: form.quantityUnit || undefined,
        omieCode: form.omieCode || null,
        parsedProductName: form.parsedProductName || null,
        productDescription: form.productDescription || null,
        stockQuantity: form.stockQuantity ? Number(form.stockQuantity) : null,
        minimumStock: form.minimumStock ? Number(form.minimumStock) : null,
      };
      onSubmit(data);
    } else {
      const data: CreateInternalProductionOrderInput = {
        title: form.title,
        lote: form.lote,
        quantityValue: Number(form.quantityValue),
        quantityUnit: form.quantityUnit,
        source: form.source,
        omieCode: form.omieCode || null,
        parsedProductName: form.parsedProductName || null,
        productDescription: form.productDescription || null,
        stockQuantity: form.stockQuantity ? Number(form.stockQuantity) : null,
        minimumStock: form.minimumStock ? Number(form.minimumStock) : null,
      };
      onSubmit(data);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar OP Interna' : 'Nova OP Interna'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isEditing && (
          <div>
            <label className={labelClass}>Origem</label>
            <select
              value={form.source}
              onChange={(e) => set('source', e.target.value as 'MANUAL' | 'TRELLO')}
              className={inputClass}
            >
              <option value="MANUAL">Manual</option>
              <option value="TRELLO">Trello</option>
            </select>
          </div>
        )}

        <div>
          <label className={labelClass}>Título *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            className={inputClass}
            required
          />
        </div>

        <div className={rowClass}>
          <div className="flex-1">
            <label className={labelClass}>Lote *</label>
            <input
              type="text"
              value={form.lote}
              onChange={(e) => set('lote', e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <div className="w-24">
            <label className={labelClass}>Unidade</label>
            <select
              value={form.quantityUnit}
              onChange={(e) => set('quantityUnit', e.target.value as 'UN' | 'B' | 'G' | 'KG')}
              className={inputClass}
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>Quantidade *</label>
          <input
            type="number"
            step="any"
            min="0"
            value={form.quantityValue}
            onChange={(e) => set('quantityValue', e.target.value)}
            className={inputClass}
            required
          />
        </div>

        <div>
          <label className={labelClass}>Código Omie</label>
          <input
            type="text"
            value={form.omieCode}
            onChange={(e) => set('omieCode', e.target.value)}
            className={inputClass}
            placeholder="Opcional"
          />
        </div>

        <div>
          <label className={labelClass}>Nome do Produto (parseado)</label>
          <input
            type="text"
            value={form.parsedProductName}
            onChange={(e) => set('parsedProductName', e.target.value)}
            className={inputClass}
            placeholder="Opcional"
          />
        </div>

        <div>
          <label className={labelClass}>Descrição do Produto</label>
          <input
            type="text"
            value={form.productDescription}
            onChange={(e) => set('productDescription', e.target.value)}
            className={inputClass}
            placeholder="Opcional"
          />
        </div>

        <div className={rowClass}>
          <div className="flex-1">
            <label className={labelClass}>Estoque Atual</label>
            <input
              type="number"
              step="any"
              value={form.stockQuantity}
              onChange={(e) => set('stockQuantity', e.target.value)}
              className={inputClass}
              placeholder="Opcional"
            />
          </div>
          <div className="flex-1">
            <label className={labelClass}>Estoque Mínimo</label>
            <input
              type="number"
              step="any"
              value={form.minimumStock}
              onChange={(e) => set('minimumStock', e.target.value)}
              className={inputClass}
              placeholder="Opcional"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-zinc-700 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? 'Salvando...' : isEditing ? 'Atualizar' : 'Criar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
