import { describe, it, expect } from 'vitest'
import { parseCardName } from './parse-card-name'

describe('parseCardName', () => {
  describe('Formato A: nome - lote - quantidade unidade', () => {
    it('deve parsear formato nome - lote - 108 un', () => {
      const result = parseCardName('PARAFUSO - LOTE001 - 108 un')
      expect(result).not.toBeNull()
      expect(result!.parsedProductName).toBe('PARAFUSO')
      expect(result!.omieCode).toBeNull()
      expect(result!.lote).toBe('LOTE001')
      expect(result!.quantityValue).toBe(108)
      expect(result!.quantityUnit).toBe('UN')
    })

    it('deve parsear nome composto', () => {
      const result = parseCardName('Porca sextavada M8 - LOTE-XYZ - 500 un')
      expect(result).not.toBeNull()
      expect(result!.parsedProductName).toBe('Porca sextavada M8')
      expect(result!.omieCode).toBeNull()
      expect(result!.lote).toBe('LOTE-XYZ')
      expect(result!.quantityValue).toBe(500)
      expect(result!.quantityUnit).toBe('UN')
    })

    it('deve parsear com unidade KG', () => {
      const result = parseCardName('Resina - RES-001 - 25 KG')
      expect(result).not.toBeNull()
      expect(result!.parsedProductName).toBe('Resina')
      expect(result!.omieCode).toBeNull()
      expect(result!.lote).toBe('RES-001')
      expect(result!.quantityValue).toBe(25)
      expect(result!.quantityUnit).toBe('KG')
    })

    it('deve parsear com unidade UNIDADE (alias de UN)', () => {
      const result = parseCardName('Peça - LOTE99 - 10 unidade')
      expect(result).not.toBeNull()
      expect(result!.quantityUnit).toBe('UN')
      expect(result!.quantityValue).toBe(10)
    })
  })

  describe('Formato B: nome - omieCode - lote - quantidade unidade', () => {
    it('deve parsear formato nome - codigo - lote - 2 kg', () => {
      const result = parseCardName('PARAFUSO - COD-001 - LOTE001 - 2 kg')
      expect(result).not.toBeNull()
      expect(result!.parsedProductName).toBe('PARAFUSO')
      expect(result!.omieCode).toBe('COD-001')
      expect(result!.lote).toBe('LOTE001')
      expect(result!.quantityValue).toBe(2)
      expect(result!.quantityUnit).toBe('KG')
    })

    it('deve parsear nome composto com código', () => {
      const result = parseCardName('Resina Epóxi - 4000.ABC - LOTE-X - 15 kg')
      expect(result).not.toBeNull()
      expect(result!.parsedProductName).toBe('Resina Epóxi')
      expect(result!.omieCode).toBe('4000.ABC')
      expect(result!.lote).toBe('LOTE-X')
      expect(result!.quantityValue).toBe(15)
      expect(result!.quantityUnit).toBe('KG')
    })
  })

  describe('Formato C: omieCode - lote - quantidade unidade', () => {
    it('deve parsear formato codigo - lote - 300 g', () => {
      const result = parseCardName('COD-001 - LOTE001 - 300 g')
      expect(result).not.toBeNull()
      expect(result!.parsedProductName).toBeNull()
      expect(result!.omieCode).toBe('COD-001')
      expect(result!.lote).toBe('LOTE001')
      expect(result!.quantityValue).toBe(300)
      expect(result!.quantityUnit).toBe('G')
    })

    it('deve parsear código sem hífen', () => {
      const result = parseCardName('ABC123 - LOTE002 - 1 kg')
      expect(result).not.toBeNull()
      expect(result!.omieCode).toBe('ABC123')
      expect(result!.lote).toBe('LOTE002')
      expect(result!.quantityValue).toBe(1)
      expect(result!.quantityUnit).toBe('KG')
    })

    it('deve parsear código numérico', () => {
      const result = parseCardName('3830837835825 - LOTE-999 - 250 un')
      expect(result).not.toBeNull()
      expect(result!.omieCode).toBe('3830837835825')
      expect(result!.parsedProductName).toBeNull()
      expect(result!.lote).toBe('LOTE-999')
      expect(result!.quantityValue).toBe(250)
    })
  })

  describe('Entradas inválidas', () => {
    it('rejeita string vazia', () => {
      expect(parseCardName('')).toBeNull()
    })

    it('rejeita nome sem unidade', () => {
      const result = parseCardName('Produto - LOTE001')
      expect(result).toBeNull()
    })

    it('rejeita unidade não permitida', () => {
      const result = parseCardName('Produto - LOTE001 - 10 L')
      expect(result).toBeNull()
    })

    it('rejeita quando falta lote', () => {
      const result = parseCardName('Produto - 10 un')
      expect(result).toBeNull()
    })

    it('rejeita quantidade zero', () => {
      const result = parseCardName('Produto - LOTE001 - 0 un')
      expect(result).toBeNull()
    })

    it('rejeita quantidade negativa', () => {
      const result = parseCardName('Produto - LOTE001 - -5 kg')
      expect(result).toBeNull()
    })
  })

  describe('Entradas com espaços extras', () => {
    it('deve trimmar espaços nas bordas', () => {
      const result = parseCardName('  PARAFUSO - LOTE001 - 108 un  ')
      expect(result).not.toBeNull()
      expect(result!.parsedProductName).toBe('PARAFUSO')
      expect(result!.quantityValue).toBe(108)
    })
  })
})
