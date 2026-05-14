import { describe, it, expect } from 'vitest'
import { computeDiff } from './diff'

describe('computeDiff', () => {
  it('retorna changes vazio quando before e after são idênticos', () => {
    const before = { status: 'PENDING', lote: 'LOTE-001' }
    const after = { status: 'PENDING', lote: 'LOTE-001' }

    const result = computeDiff(before, after)

    expect(result).toEqual([])
  })

  it('ignora campo updatedAt', () => {
    const before = { status: 'PENDING', updatedAt: new Date('2026-01-01') }
    const after = { status: 'PENDING', updatedAt: new Date('2026-01-02') }

    const result = computeDiff(before, after)

    expect(result).toEqual([])
  })

  it('detecta mudança em campo único', () => {
    const before = { status: 'PENDING', lote: 'LOTE-001' }
    const after = { status: 'IN_PROGRESS', lote: 'LOTE-001' }

    const result = computeDiff(before, after)

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ field: 'status', before: 'PENDING', after: 'IN_PROGRESS' })
  })

  it('detecta múltiplas mudanças', () => {
    const before = { status: 'PENDING', lote: 'LOTE-001', productDescription: null }
    const after = { status: 'IN_PROGRESS', lote: 'LOTE-002', productDescription: 'Produto X' }

    const result = computeDiff(before, after)

    expect(result).toHaveLength(3)
    expect(result).toContainEqual({ field: 'status', before: 'PENDING', after: 'IN_PROGRESS' })
    expect(result).toContainEqual({ field: 'lote', before: 'LOTE-001', after: 'LOTE-002' })
    expect(result).toContainEqual({ field: 'productDescription', before: null, after: 'Produto X' })
  })

  it('detecta campo que existia em before mas sumiu em after', () => {
    const before = { status: 'PENDING', lote: 'LOTE-001' }
    const after = { status: 'IN_PROGRESS' }

    const result = computeDiff(before, after)

    expect(result).toContainEqual({ field: 'lote', before: 'LOTE-001', after: null })
    expect(result).toHaveLength(2)
  })

  it('detecta campo novo em after que não existia em before', () => {
    const before = { status: 'PENDING' }
    const after = { status: 'IN_PROGRESS', startedAt: new Date('2026-05-13') }

    const result = computeDiff(before, after)

    expect(result).toContainEqual({ field: 'startedAt', before: null, after: '2026-05-13T00:00:00.000Z' })
    expect(result).toHaveLength(2)
  })

  it('converte Date para ISO string', () => {
    const before = { startedAt: null }
    const after = { startedAt: new Date('2026-05-13T10:00:00.000Z') }

    const result = computeDiff(before, after)

    expect(result[0]).toEqual({ field: 'startedAt', before: null, after: '2026-05-13T10:00:00.000Z' })
  })

  it('converte valores numéricos para string', () => {
    const before = { stockQuantity: 10 }
    const after = { stockQuantity: 20 }

    const result = computeDiff(before, after)

    expect(result[0]).toEqual({ field: 'stockQuantity', before: '10', after: '20' })
  })

  it('trata undefined como null', () => {
    const before = { status: 'PENDING', lote: undefined }
    const after = { status: 'PENDING', lote: 'LOTE-001' }

    const result = computeDiff(before, after)

    expect(result).toContainEqual({ field: 'lote', before: null, after: 'LOTE-001' })
  })

  it('retorna vazio se a única mudança é updatedAt', () => {
    const before = { status: 'PENDING', updatedAt: new Date('2026-01-01') }
    const after = { status: 'PENDING', updatedAt: new Date('2026-01-02') }

    const result = computeDiff(before, after)

    expect(result).toEqual([])
  })
})
