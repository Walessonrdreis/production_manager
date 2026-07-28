import type { CalendarData } from './types';

export function pad(value: number) {
  return value.toString().padStart(2, '0');
}

/**
 * Converte Date/string em chave YYYY-MM-DD (timezone local).
 */
export function toDateKey(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Converte YYYY-MM-DD para Date (timezone local).
 */
export function parseDateKey(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/**
 * Gera lista de dateKeys entre start e end (inclusive).
 */
export function enumerateDateKeys(startValue: string | Date, endValue: string | Date) {
  const start = parseDateKey(toDateKey(startValue));
  const end = parseDateKey(toDateKey(endValue));
  const result: string[] = [];

  while (start <= end) {
    result.push(toDateKey(start));
    start.setDate(start.getDate() + 1);
  }

  return result;
}

export type Segment = {
  key: string;
  label: string;
  dateKeys: string[];
};

/**
 * Agrupa dateKeys por dia/semana/mês.
 * - day: 1 segmento por dia
 * - week: agrupa por semana (começando segunda-feira)
 * - month: agrupa por mês
 */
export function buildSegments(dateKeys: string[], mode: 'day' | 'week' | 'month'): Segment[] {
  if (mode === 'day') {
    return dateKeys.map((dateKey) => ({
      key: dateKey,
      label: parseDateKey(dateKey).toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
      }),
      dateKeys: [dateKey],
    }));
  }

  const grouped = new Map<string, string[]>();

  for (const dateKey of dateKeys) {
    const date = parseDateKey(dateKey);

    if (mode === 'week') {
      // Ajusta para segunda-feira como início da semana
      const day = date.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      date.setDate(date.getDate() + diff);
    } else {
      // mês: primeiro dia do mês
      date.setDate(1);
    }

    const groupKey = toDateKey(date);
    const current = grouped.get(groupKey) ?? [];
    current.push(dateKey);
    grouped.set(groupKey, current);
  }

  return Array.from(grouped.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, values]) => ({
      key,
      label:
        mode === 'week'
          ? `${parseDateKey(values[0]).toLocaleDateString('pt-BR')} até ${parseDateKey(
              values[values.length - 1]
            ).toLocaleDateString('pt-BR')}`
          : parseDateKey(key).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
      dateKeys: values,
    }));
}

/**
 * Normaliza CalendarData carregado do storage:
 * - garante array por dateKey
 * - filtra entradas inválidas
 * - converte quantity para number
 * - garante strings (note/sectorId)
 */
export function normalizeCalendarData(dateKeys: string[], storedData?: CalendarData) {
  const normalized: CalendarData = {};

  for (const dateKey of dateKeys) {
    const entries = storedData?.[dateKey];
    normalized[dateKey] = Array.isArray(entries)
      ? entries
          .filter((entry) => entry && typeof entry.productId === 'string')
          .map((entry) => ({
            id: entry.id,
            productId: entry.productId,
            sectorId: (entry as any).sectorId ?? '',
            quantity: Number((entry as any).quantity) || 0,
            note: (entry as any).note ?? '',
          }))
      : [];
  }

  return normalized;
}
``