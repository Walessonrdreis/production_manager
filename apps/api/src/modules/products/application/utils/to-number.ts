export function toNumber(value: any): number | null {
  if (value == null) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const parsed = Number(value.trim().replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (typeof value?.toNumber === "function") {
    const num = value.toNumber();
    return Number.isFinite(num) ? num : null;
  }
  const asString = typeof value?.toString === "function" ? value.toString() : String(value);
  const parsed = Number(String(asString).trim().replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}