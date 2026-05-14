import type { ParsedCardName } from '../dtos/trello-webhook-event.dto'

const VALID_UNITS = new Set(['UN', 'B', 'G', 'KG'])
const UNIT_ALIASES: Record<string, 'UN'> = { UNIDADE: 'UN' }

function normalizeUnit(raw: string): 'UN' | 'B' | 'G' | 'KG' {
  const upper = raw.toUpperCase()
  if (upper in UNIT_ALIASES) return UNIT_ALIASES[upper]
  if (VALID_UNITS.has(upper)) return upper as 'UN' | 'B' | 'G' | 'KG'
  return 'UN'
}

function looksLikeOmieCode(value: string): boolean {
  return /^\d/.test(value) || /^[A-Z0-9][A-Z0-9._/-]*\d[A-Z0-9._/-]*$/i.test(value)
}

function splitParts(input: string): string[] {
  return input.split(/\s+-\s+/).map((p) => p.trim()).filter((p) => p.length > 0)
}

function tryParseQtyUnit(raw: string): { quantityValue: number; quantityUnit: 'UN' | 'B' | 'G' | 'KG' } | null {
  const match = /^(\d+(?:\.\d+)?)\s*(UN|UNIDADE|B|G|KG)\s*$/i.exec(raw)
  if (!match) return null
  const qty = Number(match[1])
  if (qty <= 0) return null
  return { quantityValue: qty, quantityUnit: normalizeUnit(match[2]) }
}

export function parseCardName(cardName: string): ParsedCardName | null {
  const trimmed = cardName.trim()
  if (!trimmed) return null

  const parts = splitParts(trimmed)
  if (parts.length < 3) return null

  const last = parts[parts.length - 1]
  const qtyParsed = tryParseQtyUnit(last)
  if (!qtyParsed) return null

  const lote = parts[parts.length - 2]
  const before = parts.slice(0, parts.length - 2)

  if (before.length === 2) {
    return {
      parsedProductName: before[0],
      omieCode: before[1],
      lote,
      quantityValue: qtyParsed.quantityValue,
      quantityUnit: qtyParsed.quantityUnit,
    }
  }

  if (before.length === 1) {
    const first = before[0]
    if (looksLikeOmieCode(first)) {
      return {
        parsedProductName: null,
        omieCode: first,
        lote,
        quantityValue: qtyParsed.quantityValue,
        quantityUnit: qtyParsed.quantityUnit,
      }
    }
    return {
      parsedProductName: first,
      omieCode: null,
      lote,
      quantityValue: qtyParsed.quantityValue,
      quantityUnit: qtyParsed.quantityUnit,
    }
  }

  if (before.length > 2) {
    return {
      parsedProductName: before.slice(0, -1).join(' - '),
      omieCode: before[before.length - 1],
      lote,
      quantityValue: qtyParsed.quantityValue,
      quantityUnit: qtyParsed.quantityUnit,
    }
  }

  return null
}
