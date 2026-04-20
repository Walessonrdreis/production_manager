export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

export function safeJson(value: any) {
  try {
    return JSON.stringify(value ?? null, null, 2)
  } catch {
    return String(value)
  }
}