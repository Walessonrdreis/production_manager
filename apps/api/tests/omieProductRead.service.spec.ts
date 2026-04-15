import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/db', () => {
  return {
    prisma: {
      omieProduct: {
        findMany: vi.fn(),
      },
      productStock: {
        findMany: vi.fn(),
      },
    },
  };
});

import { prisma } from '../src/db';
import { listOmieProductsWithCurrentStock } from '../src/services/omieProductRead.service';

describe('listOmieProductsWithCurrentStock', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('retorna stockQuantity=0 quando não existe ProductStock e faz 1 query por tabela', async () => {
    (prisma.omieProduct.findMany as any).mockResolvedValue([
      { id: '1', omieCode: 'XTE', description: 'Produto X', familyDescription: null, rawPayload: {} },
      { id: '2', omieCode: 'ABC', description: 'Produto A', familyDescription: null, rawPayload: {} },
    ]);

    (prisma.productStock.findMany as any).mockResolvedValue([
      { omieCode: 'XTE', stockQuantity: '10', minimumStock: '2', updatedAt: new Date('2026-04-15T00:00:00.000Z') },
    ]);

    const result = await listOmieProductsWithCurrentStock();

    expect(prisma.omieProduct.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.productStock.findMany).toHaveBeenCalledTimes(1);

    const byCode = new Map(result.items.map((x: any) => [x.omieCode, x]));
    expect(byCode.get('XTE').stockQuantity).toBe('10');
    expect(byCode.get('ABC').stockQuantity).toBe('0');
    expect(result.stockUpdatedAt).toBe('2026-04-15T00:00:00.000Z');
  });
});

