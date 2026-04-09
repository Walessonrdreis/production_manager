import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreatePlanItemService } from '../src/services/CreatePlanItemService';
import { MissingDefaultSectorError } from '../src/utils/domainErrors';
import { prisma } from '../src/db';

// Realiza o mock do db.ts (Prisma Client)
vi.mock('../src/db', () => ({
  prisma: {
    productionPlan: { findUnique: vi.fn() },
    product: { findUnique: vi.fn() },
    productSector: { findUnique: vi.fn() },
    sector: { findUnique: vi.fn() },
    productionPlanItem: { create: vi.fn() },
  },
}));

describe('CreatePlanItemService', () => {
  let service: CreatePlanItemService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CreatePlanItemService();
  });

  it('deve adicionar um item utilizando o sectorId passado explicitamente', async () => {
    // Configura os mocks para os steps validos
    vi.mocked(prisma.productionPlan.findUnique).mockResolvedValue({ id: 'plan-1' } as any);
    vi.mocked(prisma.product.findUnique).mockResolvedValue({ id: 'prod-1' } as any);
    vi.mocked(prisma.sector.findUnique).mockResolvedValue({ id: 'sect-1', active: true } as any);
    vi.mocked(prisma.productionPlanItem.create).mockResolvedValue({ id: 'item-1', sectorId: 'sect-1' } as any);

    const result = await service.execute({
      planId: 'plan-1',
      productId: 'prod-1',
      quantity: 10,
      sectorId: 'sect-1',
    });

    expect(prisma.sector.findUnique).toHaveBeenCalledWith({ where: { id: 'sect-1' } });
    expect(prisma.productSector.findUnique).not.toHaveBeenCalled();
    expect(result.id).toBe('item-1');
  });

  it('deve resolver e utilizar o setor padrão do produto caso sectorId seja omitido', async () => {
    vi.mocked(prisma.productionPlan.findUnique).mockResolvedValue({ id: 'plan-1' } as any);
    vi.mocked(prisma.product.findUnique).mockResolvedValue({ id: 'prod-1' } as any);
    
    // Mocka o mapeamento ProductSector
    vi.mocked(prisma.productSector.findUnique).mockResolvedValue({ productId: 'prod-1', sectorId: 'default-sector-1' } as any);
    
    vi.mocked(prisma.productionPlanItem.create).mockResolvedValue({ id: 'item-1', sectorId: 'default-sector-1' } as any);

    const result = await service.execute({
      planId: 'plan-1',
      productId: 'prod-1',
      quantity: 5,
    });

    // Verifica se ele de fato buscou o setor padrão
    expect(prisma.productSector.findUnique).toHaveBeenCalledWith({ where: { productId: 'prod-1' } });
    
    // Verifica se criou o item passando o sectorId do mapeamento default
    expect(prisma.productionPlanItem.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ sectorId: 'default-sector-1' })
      })
    );
    expect(result.id).toBe('item-1');
  });

  it('deve falhar com MISSING_DEFAULT_SECTOR se sectorId for omitido e o produto não tiver setor padrão', async () => {
    vi.mocked(prisma.productionPlan.findUnique).mockResolvedValue({ id: 'plan-1' } as any);
    vi.mocked(prisma.product.findUnique).mockResolvedValue({ id: 'prod-1' } as any);
    
    // Simula produto sem setor padrao (null)
    vi.mocked(prisma.productSector.findUnique).mockResolvedValue(null);

    await expect(
      service.execute({
        planId: 'plan-1',
        productId: 'prod-1',
        quantity: 5,
      })
    ).rejects.toThrowError(new MissingDefaultSectorError());

    // Garante que não tentou criar
    expect(prisma.productionPlanItem.create).not.toHaveBeenCalled();
  });
});
