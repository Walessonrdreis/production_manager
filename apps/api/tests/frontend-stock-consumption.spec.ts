import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/integrations/omie/OmieStockCache', () => {
  return {
    omieStockCache: {
      getSnapshot: vi.fn(),
      getLastUpdatedAt: vi.fn(),
    },
  };
});

vi.mock('../src/db', () => {
  return {
    prisma: {
      product: {
        findUnique: vi.fn(),
      },
      omieProduct: {
        findUnique: vi.fn(),
      },
      productStock: {
        findMany: vi.fn(),
      },
    },
  };
});

import { buildApp } from '../src/app';
import { prisma } from '../src/db';
import { omieStockCache } from '../src/integrations/omie/OmieStockCache';

type ApiErrorResponse = {
  error: { code: string; message: string; details?: unknown; requestId?: string };
};

type StockData = {
  productId?: string;
  omieProductId?: string;
  omieCode: string;
  stockQuantity: string;
  minimumStock: string;
  stockCacheUpdatedAt?: string;
  capturedAt?: string;
};

type StockResponse = { data: StockData };

async function frontendGetJson(app: Awaited<ReturnType<typeof buildApp>>, url: string) {
  const response = await app.inject({ method: 'GET', url });
  const contentType = response.headers['content-type'] ?? '';
  const json = response.payload ? JSON.parse(response.payload) : null;
  return { response, contentType, json };
}

async function frontendGetStock(app: Awaited<ReturnType<typeof buildApp>>, url: string) {
  const { response, contentType, json } = await frontendGetJson(app, url);

  if (!contentType.includes('application/json')) {
    throw new Error(`Expected JSON response. content-type=${contentType}`);
  }

  if (response.statusCode >= 400) {
    const err = json as ApiErrorResponse;
    const code = err?.error?.code ?? 'UNKNOWN';
    throw new Error(`API_ERROR:${code}`);
  }

  const ok = json as StockResponse;
  const data = ok?.data ?? null;

  return {
    status: response.statusCode,
    data: {
      productId: data?.productId,
      omieProductId: data?.omieProductId,
      omieCode: data?.omieCode ?? '',
      stockQuantity: data?.stockQuantity ?? '0',
      minimumStock: data?.minimumStock ?? '0',
      stockCacheUpdatedAt: data?.stockCacheUpdatedAt ?? data?.capturedAt ?? '',
    },
  };
}

describe('Frontend consumption (stock endpoints)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('consome GET /v1/products/:id/stock sem falhar em parsing e campos obrigatórios', async () => {
    (prisma.product.findUnique as any).mockResolvedValue({
      id: '8eaa43ac-6e71-4fe8-9ea3-2b5e4e3f2d11',
      omieProductId: '0a74a47a-3b19-4f22-9b0f-8b8d41d8c6c6',
    });

    (prisma.omieProduct.findUnique as any).mockResolvedValue({
      id: '0a74a47a-3b19-4f22-9b0f-8b8d41d8c6c6',
      omieCode: '12345',
      omieId: '12345',
      rawPayload: { codigo: '12345' },
    });

    (prisma.productStock.findMany as any).mockResolvedValue([
      {
        stockQuantity: '10',
        minimumStock: '2',
        capturedAt: new Date('2026-04-14T12:00:00.000Z'),
      },
    ]);

    const app = await buildApp();
    await app.ready();

    const result = await frontendGetStock(app, '/v1/products/8eaa43ac-6e71-4fe8-9ea3-2b5e4e3f2d11/stock');

    expect(result.status).toBe(200);
    expect(result.data.omieCode).toBe('12345');
    expect(result.data.stockQuantity).toBe('10.0000');
    expect(result.data.minimumStock).toBe('2.0000');
    expect(result.data.stockCacheUpdatedAt).toBe('2026-04-14T12:00:00.000Z');

    await app.close();
  });

  it('consome GET /v1/omie/products/:id/stock sem falhar em parsing', async () => {
    (prisma.omieProduct.findUnique as any).mockResolvedValue({
      id: '0a74a47a-3b19-4f22-9b0f-8b8d41d8c6c6',
      omieCode: '777',
      omieId: '777',
      rawPayload: { codigo: '777' },
    });

    (prisma.productStock.findMany as any).mockResolvedValue([
      {
        stockQuantity: '1',
        minimumStock: '0',
        capturedAt: new Date('2026-04-14T12:00:00.000Z'),
      },
    ]);

    const app = await buildApp();
    await app.ready();

    const result = await frontendGetStock(app, '/v1/omie/products/0a74a47a-3b19-4f22-9b0f-8b8d41d8c6c6/stock');

    expect(result.status).toBe(200);
    expect(result.data.omieCode).toBe('777');
    expect(result.data.stockQuantity).toBe('1.0000');
    expect(result.data.minimumStock).toBe('0.0000');

    await app.close();
  });

  it('consome GET /v1/omie/products/by-code/:omieCode/stock retornando zeros sem quebrar o frontend', async () => {
    (prisma.productStock.findMany as any).mockResolvedValue([
      {
        stockQuantity: null,
        minimumStock: null,
        capturedAt: new Date('2026-04-14T12:00:00.000Z'),
      },
    ]);

    const app = await buildApp();
    await app.ready();

    const result = await frontendGetStock(app, '/v1/omie/products/by-code/99999/stock');

    expect(result.status).toBe(200);
    expect(result.data.omieCode).toBe('99999');
    expect(result.data.stockQuantity).toBe('0.0000');
    expect(result.data.minimumStock).toBe('0.0000');
    expect(result.data.stockCacheUpdatedAt).toBe('2026-04-14T12:00:00.000Z');

    await app.close();
  });

  it('frontend recebe erro padronizado quando OmieProduct não existe', async () => {
    (prisma.omieProduct.findUnique as any).mockResolvedValue(null);

    const app = await buildApp();
    await app.ready();

    await expect(
      frontendGetStock(app, '/v1/omie/products/0a74a47a-3b19-4f22-9b0f-8b8d41d8c6c6/stock')
    ).rejects.toThrow('API_ERROR:OMIE_PRODUCT_NOT_FOUND');

    await app.close();
  });
});
