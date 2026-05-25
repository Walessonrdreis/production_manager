export interface FieldChange {
  field: string
  before: string | null
  after: string | null
}

function normalizeValue(value: unknown): string | null {
  if (value === null || value === undefined) return null
  if (value instanceof Date) return value.toISOString()
  return String(value)
}

export function computeDiff(before: Record<string, unknown>, after: Record<string, unknown>): FieldChange[] {
  const changes: FieldChange[] = []

  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)])

  for (const key of allKeys) {
    if (key === 'updatedAt') continue

    const beforeVal = normalizeValue(before[key])
    const afterVal = normalizeValue(after[key])

    if (beforeVal !== afterVal) {
      changes.push({ field: key, before: beforeVal, after: afterVal })
    }
  }

  return changes
}
