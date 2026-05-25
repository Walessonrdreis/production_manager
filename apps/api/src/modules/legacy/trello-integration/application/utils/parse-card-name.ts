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

function splitBeforeQty(beforeQty: string): string[] {
  const parts = beforeQty.split(/\s+-\s+/).map(s => s.trim()).filter(Boolean)
  if (parts.length >= 2) return parts

  const lastSpaceHyphen = beforeQty.lastIndexOf(' -')
  const lastHyphenSpace = beforeQty.lastIndexOf('- ')
  const splitPos = Math.max(
    lastSpaceHyphen > 0 ? lastSpaceHyphen : -1,
    lastHyphenSpace > 0 ? lastHyphenSpace : -1,
  )

  if (splitPos > 0) {
    const left = beforeQty.slice(0, splitPos).trim()
    const right = beforeQty.slice(splitPos + 2).trim()
    if (left && right) return [left, right]
  }

  return parts
}

export function parseCardName(cardName: string): ParsedCardName | null {
  const trimmed = cardName.trim()
  if (!trimmed) return null

  const qtyRegex = /(\d+(?:\.\d+)?)\s*(UN|UNIDADE|B|G|KG)\s*(?:\([^)]*\))?\s*$/i
  const qtyMatch = qtyRegex.exec(trimmed)
  if (!qtyMatch) return null

  if (qtyMatch.index > 0 && trimmed[qtyMatch.index - 1] === '-') return null

  const quantityValue = Number(qtyMatch[1])
  if (quantityValue <= 0) return null
  const quantityUnit = normalizeUnit(qtyMatch[2])

  const beforeQty = trimmed.slice(0, qtyMatch.index).trim()
  if (!beforeQty) return null

  const beforeQtyClean = beforeQty.replace(/-\s*$/, '').trim()
  if (!beforeQtyClean) return null

  const segments = splitBeforeQty(beforeQtyClean)
  if (segments.length < 2) return null

  const lote = segments[segments.length - 1]
  const before = segments.slice(0, -1)

  if (before.length === 1) {
    const first = before[0]
    if (!first) {
      return { parsedProductName: null, omieCode: null, lote, quantityValue, quantityUnit }
    }
    if (looksLikeOmieCode(first)) {
      return { parsedProductName: null, omieCode: first, lote, quantityValue, quantityUnit }
    }
    return { parsedProductName: first, omieCode: null, lote, quantityValue, quantityUnit }
  }

  if (before.length === 2) {
    return {
      parsedProductName: before[0],
      omieCode: before[1],
      lote,
      quantityValue,
      quantityUnit,
    }
  }

  if (before.length > 2) {
    return {
      parsedProductName: before.slice(0, -1).join(' - '),
      omieCode: before[before.length - 1],
      lote,
      quantityValue,
      quantityUnit,
    }
  }

  return null
}
