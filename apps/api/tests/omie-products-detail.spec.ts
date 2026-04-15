import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/integrations/omie/OmieStockCache', () => {
  return {
    omieStockCache: {
      getSnapshot: vi.fn(),
      getLastUpdatedAt: vi.fn(),
      refreshNow: vi.fn(),
    },
  };
});

vi.mock('../src/db', () => {
  return {
    prisma: {
      omieProduct: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        count: vi.fn(),
      },
      product: {
        findUnique: vi.fn(),
      },
    },
  };
});

import { buildApp } from '../src/app';
import { prisma } from '../src/db';

describe('Omie product detail endpoints', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('GET /v1/omie/products/:id retorna shape canônico sem rawPayload por default', async () => {
    (prisma.omieProduct.findUnique as any).mockResolvedValue({
      id: '0a74a47a-3b19-4f22-9b0f-8b8d41d8c6c6',
      omieId: '12345',
      omieCode: '12345',
      description: 'Produto X',
      sku: 'SKU-X',
      familyDescription: 'Corte',
      active: true,
      rawPayload: { descricao_familia: 'Corte', any: 'debug' },
    });

    const app = await buildApp();
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/v1/omie/products/0a74a47a-3b19-4f22-9b0f-8b8d41d8c6c6',
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');

    const body = JSON.parse(response.payload);
    expect(body.data).toMatchObject({
      id: '0a74a47a-3b19-4f22-9b0f-8b8d41d8c6c6',
      description: 'Produto X',
      sku: 'SKU-X',
      familyDescription: 'Corte',
      active: true,
      omieCode: '12345',
    });
    expect(body.data.rawPayload).toBeUndefined();

    await app.close();
  });

  it('GET /v1/omie/products/:id?includeRaw=true inclui rawPayload', async () => {
    (prisma.omieProduct.findUnique as any).mockResolvedValue({
      id: '0a74a47a-3b19-4f22-9b0f-8b8d41d8c6c6',
      omieId: '12345',
      omieCode: '12345',
      description: 'Produto X',
      sku: 'SKU-X',
      familyDescription: 'Corte',
      active: true,
      rawPayload: { descricao_familia: 'Corte', any: 'debug' },
    });

    const app = await buildApp();
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/v1/omie/products/0a74a47a-3b19-4f22-9b0f-8b8d41d8c6c6?includeRaw=true',
    });

    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.payload);
    expect(body.data.rawPayload).toEqual({ descricao_familia: 'Corte', any: 'debug' });

    await app.close();
  });

  it('GET /v1/omie/products/by-code/:omieCode busca por omieCode e retorna canônico', async () => {
    (prisma.omieProduct.findUnique as any).mockResolvedValue({
      id: '0a74a47a-3b19-4f22-9b0f-8b8d41d8c6c6',
      omieId: '9116172831',
      omieCode: '99999',
      description: 'Produto Y',
      sku: null,
      active: false,
      familyDescription: 'Costura',
      rawPayload: { descricao_familia: 'Costura' },
    });

    const app = await buildApp();
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/v1/omie/products/by-code/99999',
    });

    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.payload);
    expect(body.data.omieCode).toBe('99999');
    expect(body.data.familyDescription).toBe('Costura');

    await app.close();
  });

  it('quando não encontrado retorna 404 OMIE_PRODUCT_NOT_FOUND', async () => {
    (prisma.omieProduct.findUnique as any).mockResolvedValue(null);
    (prisma.omieProduct.findFirst as any).mockResolvedValue(null);

    const app = await buildApp();
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/v1/omie/products/by-code/does-not-exist',
    });

    expect(response.statusCode).toBe(404);

    const body = JSON.parse(response.payload);
    expect(body.error.code).toBe('OMIE_PRODUCT_NOT_FOUND');

    await app.close();
  });
});
