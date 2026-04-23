// src/shared/integrations/omie/omie.utils.ts

/**
 * Converte data no formato BR "dd/mm/yyyy" para Date em UTC (00:00:00.000Z).
 * Retorna null para entradas inválidas.
 */
export function brDateToISO(d?: string | null): Date | null {
  const raw = String(d ?? "").trim();
  if (!raw) return null;

  const [ddStr, mmStr, yyyyStr] = raw.split("/").map((p) => p.trim());
  if (!ddStr || !mmStr || !yyyyStr) return null;

  const dd = Number(ddStr);
  const mm = Number(mmStr);
  const yyyy = Number(yyyyStr);

  if (!Number.isInteger(dd) || !Number.isInteger(mm) || !Number.isInteger(yyyy)) return null;
  if (yyyy < 1000 || yyyy > 9999) return null;
  if (mm < 1 || mm > 12) return null;
  if (dd < 1 || dd > 31) return null;

  // Monta em UTC (atenção: mês em JS Date é 0-based)
  const date = new Date(Date.UTC(yyyy, mm - 1, dd, 0, 0, 0, 0));

  // Valida rollover (ex.: 31/02 vira março, então rejeitamos)
  if (
    date.getUTCFullYear() !== yyyy ||
    date.getUTCMonth() !== mm - 1 ||
    date.getUTCDate() !== dd
  ) {
    return null;
  }

  return date;
}

/**
 * Omie costuma usar "S"/"N". Aceita também "SIM"/"NAO" por segurança.
 */
export function isSim(v: unknown): boolean {
  const s = String(v ?? "").trim().toUpperCase();
  return s === "S" || s === "SIM";
}
