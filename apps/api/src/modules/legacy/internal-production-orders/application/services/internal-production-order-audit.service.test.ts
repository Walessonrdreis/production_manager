import { describe, it, expect, vi, beforeEach } from 'vitest'
import { InternalProductionOrderAuditService } from './internal-production-order-audit.service'
import type { InternalProductionOrderRepositoryPort, CreateChangeInput } from '../ports/internal-production-order.repository.port'
import type { ProductsCatalogPort } from '../ports/products-catalog.port'
import type { InternalProductionOrder } from '../entities/internal-production-order.entity'

const mockRepository: InternalProductionOrderRepositoryPort = {
  create: vi.fn(),
  update: vi.fn(),
  start: vi.fn(),
  complete: vi.fn(),
  findById: vi.fn(),
  findByTrelloCardId: vi.fn(),
  list: vi.fn(),
  createEventWithChanges: vi.fn(),
}

const mockCatalog: ProductsCatalogPort = {
  findByOmieCode: vi.fn(),
}

const mockLogger = {
  info: vi.fn(),
  error: vi.fn(),
}

const makeOrder = (overrides: Partial<InternalProductionOrder> = {}): InternalProductionOrder => ({
  id: 'order-1',
  trelloCardId: null,
  trelloCardUrl: null,
  source: 'MANUAL',
  status: 'PENDING',
  lote: 'LOTE-001',
  quantityValue: 100,
  quantityUnit: 'UN',
  omieCode: null,
  parsedProductName: null,
  productDescription: null,
  stockQuantity: null,
  minimumStock: null,
  startedAt: null,
  completedAt: null,
  createdAt: new Date('2026-05-13'),
  updatedAt: new Date('2026-05-13'),
  ...overrides,
})

describe('InternalProductionOrderAuditService', () => {
  let service: InternalProductionOrderAuditService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new InternalProductionOrderAuditService(mockRepository, mockCatalog, mockLogger)
  })

  describe('recordEvent', () => {
    it('deve criar evento sem changes', async () => {
      await service.recordEvent('order-1', 'CREATED', 'SYSTEM', null, 'MANUAL', 'OP criada')

      expect(mockRepository.createEventWithChanges).toHaveBeenCalledWith(
        { orderId: 'order-1', type: 'CREATED', actorType: 'SYSTEM', actorId: null, source: 'MANUAL', message: 'OP criada' },
        [],
      )
    })

    it('deve criar evento com changes', async () => {
      const changes: CreateChangeInput[] = [
        { field: 'status', before: 'PENDING', after: 'IN_PROGRESS' },
      ]

      await service.recordEvent('order-1', 'UPDATED', 'USER', 'user-1', 'SYSTEM', 'OP atualizada', changes)

      expect(mockRepository.createEventWithChanges).toHaveBeenCalledWith(
        { orderId: 'order-1', type: 'UPDATED', actorType: 'USER', actorId: 'user-1', source: 'SYSTEM', message: 'OP atualizada' },
        changes,
      )
    })
  })

  describe('recordEventFromDiff', () => {
    it('deve criar evento + changes quando há diferenças', async () => {
      const before = { status: 'PENDING', startedAt: null }
      const after = { status: 'IN_PROGRESS', startedAt: new Date('2026-05-13T10:00:00.000Z') }

      await service.recordEventFromDiff('order-1', 'STARTED', 'SYSTEM', null, 'SYSTEM', 'OP iniciada', before, after)

      expect(mockRepository.createEventWithChanges).toHaveBeenCalledWith(
        { orderId: 'order-1', type: 'STARTED', actorType: 'SYSTEM', actorId: null, source: 'SYSTEM', message: 'OP iniciada' },
        [
          { field: 'status', before: 'PENDING', after: 'IN_PROGRESS' },
          { field: 'startedAt', before: null, after: '2026-05-13T10:00:00.000Z' },
        ],
      )
    })

    it('não deve criar evento se única mudança é updatedAt', async () => {
      const before = { status: 'PENDING', updatedAt: new Date('2026-01-01') }
      const after = { status: 'PENDING', updatedAt: new Date('2026-01-02') }

      await service.recordEventFromDiff('order-1', 'UPDATED', 'SYSTEM', null, 'SYSTEM', 'sem mudanças', before, after)

      expect(mockRepository.createEventWithChanges).not.toHaveBeenCalled()
    })

    it('não deve criar evento se não há nenhuma diferença', async () => {
      const before = { status: 'PENDING', lote: 'LOTE-001' }
      const after = { status: 'PENDING', lote: 'LOTE-001' }

      await service.recordEventFromDiff('order-1', 'UPDATED', 'SYSTEM', null, 'SYSTEM', 'sem mudanças', before, after)

      expect(mockRepository.createEventWithChanges).not.toHaveBeenCalled()
    })
  })

  describe('enrichFromCatalog', () => {
    it('deve registrar LOOKUP_SKIPPED_NO_CODE quando omieCode é null', async () => {
      const order = makeOrder({ omieCode: null })

      const result = await service.enrichFromCatalog(order, 'SYSTEM', null, 'SYSTEM')

      expect(result).toBe(order)
      expect(mockCatalog.findByOmieCode).not.toHaveBeenCalled()
      expect(mockRepository.createEventWithChanges).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'LOOKUP_SKIPPED_NO_CODE' }),
        [],
      )
    })

    it('deve registrar PRODUCT_NOT_FOUND quando catálogo não encontra produto', async () => {
      const order = makeOrder({ omieCode: 'COD-001' })
      vi.mocked(mockCatalog.findByOmieCode).mockResolvedValue(null)

      const result = await service.enrichFromCatalog(order, 'SYSTEM', null, 'SYSTEM')

      expect(result).toBe(order)
      expect(mockRepository.update).not.toHaveBeenCalled()
      expect(mockRepository.createEventWithChanges).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'PRODUCT_NOT_FOUND' }),
        [],
      )
    })

    it('deve enriquecer e registrar ENRICHED_FROM_OMIECODE quando produto é encontrado', async () => {
      const order = makeOrder({ omieCode: 'COD-001' })
      vi.mocked(mockCatalog.findByOmieCode).mockResolvedValue({
        productDescription: 'Produto Enriquecido',
        stockQuantity: 50,
        minimumStock: 5,
      })
      const enrichedOrder = makeOrder({
        omieCode: 'COD-001',
        productDescription: 'Produto Enriquecido',
        stockQuantity: 50,
        minimumStock: 5,
      })
      vi.mocked(mockRepository.update).mockResolvedValue(enrichedOrder)

      const result = await service.enrichFromCatalog(order, 'INTEGRATION', null, 'SYSTEM')

      expect(mockRepository.update).toHaveBeenCalledWith('order-1', {
        productDescription: 'Produto Enriquecido',
        stockQuantity: 50,
        minimumStock: 5,
      })
      expect(result.productDescription).toBe('Produto Enriquecido')
      expect(result.stockQuantity).toBe(50)
      expect(mockRepository.createEventWithChanges).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'ENRICHED_FROM_OMIECODE' }),
        expect.arrayContaining([
          expect.objectContaining({ field: 'productDescription', before: null, after: 'Produto Enriquecido' }),
        ]),
      )
    })

    it('deve registrar PRODUCT_NOT_FOUND quando catálogo retorna null mesmo com omieCode válido', async () => {
      const order = makeOrder({ omieCode: 'COD-002' })
      vi.mocked(mockCatalog.findByOmieCode).mockResolvedValue(null)

      const result = await service.enrichFromCatalog(order, 'USER', 'user-1', 'TRELLO')

      expect(result).toBe(order)
      expect(mockRepository.createEventWithChanges).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'PRODUCT_NOT_FOUND',
          actorType: 'USER',
          actorId: 'user-1',
          source: 'TRELLO',
        }),
        [],
      )
    })
  })
})
