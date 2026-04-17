// src/integrations/omie/omieUtils.ts
export function brDateToISO(d?: string | null): Date | null {
  if (!d) return null
  const [dd, mm, yyyy] = d.split('/')
  if (!dd || !mm || !yyyy) return null
  return new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`)
}

export function isSim(v: unknown): boolean {
  return String(v ?? '').trim().toUpperCase() === 'S'
}

