import type { ColumnKey } from './catalogColumns';

export const COLUMN_STORAGE_KEY = 'omieCatalog.hiddenColumns.v1';

export function loadHiddenColumns(): Set<ColumnKey> {
  try {
    const raw = window.localStorage.getItem(COLUMN_STORAGE_KEY);
    if (!raw) return new Set();

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();

    const next = new Set(parsed.filter((value): value is ColumnKey => typeof value === 'string'));
    // comportamento original: description nunca pode ficar oculta
    next.delete('description');
    return next;
  } catch {
    return new Set();
  }
}

export function persistHiddenColumns(hiddenColumns: Set<ColumnKey>) {
  window.localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(Array.from(hiddenColumns)));
}