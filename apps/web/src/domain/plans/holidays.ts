import { addDays, parseDateKey, toDateKey } from './calendar';

/**
 * Computa Domingo de Páscoa (algoritmo clássico).
 */
export function getEasterSunday(year: number) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

/**
 * Gera mapa dateKey -> nome do feriado, considerando os anos presentes em dateKeys.
 */
export function buildHolidayMap(dateKeys: string[]) {
  const years = new Set(dateKeys.map((dateKey) => parseDateKey(dateKey).getFullYear()));
  const holidays = new Map<string, string>();

  const addHoliday = (date: Date, label: string) => {
    holidays.set(toDateKey(date), label);
  };

  for (const year of years) {
    addHoliday(new Date(year, 0, 1), 'Confraternização Universal');
    addHoliday(new Date(year, 3, 21), 'Tiradentes');
    addHoliday(new Date(year, 4, 1), 'Dia do Trabalho');
    addHoliday(new Date(year, 8, 7), 'Independência do Brasil');
    addHoliday(new Date(year, 9, 12), 'Nossa Senhora Aparecida');
    addHoliday(new Date(year, 10, 2), 'Finados');
    addHoliday(new Date(year, 10, 15), 'Proclamação da República');
    addHoliday(new Date(year, 11, 25), 'Natal');

    const easter = getEasterSunday(year);
    addHoliday(addDays(easter, -48), 'Carnaval');
    addHoliday(addDays(easter, -47), 'Carnaval');
    addHoliday(addDays(easter, -2), 'Sexta-feira Santa');
    addHoliday(addDays(easter, 60), 'Corpus Christi');
  }

  return holidays;
}

/**
 * Retorna o motivo pelo qual NÃO há produção em dateKey:
 * - Feriado
 * - Sábado
 * - Domingo
 * ou null se for dia produtivo.
 */
export function getNonProductionReason(dateKey: string, holidayMap: Map<string, string>) {
  const date = parseDateKey(dateKey);
  const holiday = holidayMap.get(dateKey);

  if (holiday) return holiday;

  const day = date.getDay();
  if (day === 6) return 'Sábado';
  if (day === 0) return 'Domingo';

  return null;
}

/**
 * Conveniência: true se for permitido produzir no dia.
 */
export function isProductionDay(dateKey: string, holidayMap: Map<string, string>) {
  return getNonProductionReason(dateKey, holidayMap) === null;
}