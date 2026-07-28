export type ColumnKey =
  | 'code'
  | 'description'
  | 'family'
  | 'sku'
  | 'stock'
  | 'minimumStock'
  | 'status'
  | 'action';

export const COLUMNS: Array<{
  key: ColumnKey;
  label: string;
  width: number;
  align?: 'left' | 'center' | 'right';
}> = [
  { key: 'code', label: 'Código', width: 140 },
  { key: 'description', label: 'Descrição', width: 360 },
  { key: 'family', label: 'Categoria', width: 220 },
  { key: 'sku', label: 'SKU', width: 140 },
  { key: 'stock', label: 'Estoque', width: 130 },
  { key: 'minimumStock', label: 'Mínimo', width: 130 },
  { key: 'status', label: 'Status', width: 90, align: 'center' },
  { key: 'action', label: 'Ação', width: 120, align: 'center' },
];