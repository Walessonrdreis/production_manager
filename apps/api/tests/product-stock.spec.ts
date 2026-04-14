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
        count: vi.fn(),
      },
    },
  };
});

import { buildApp } from '../src/app';
import { prisma } from '../src/db';
import { omieStockCache } from '../src/integrations/omie/OmieStockCache';

describe('Stock endpoints', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('GET /v1/products/:id/stock - retorna 200 e payload mínimo', async () => {
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

    const response = await app.inject({
      method: 'GET',
      url: '/v1/products/8eaa43ac-6e71-4fe8-9ea3-2b5e4e3f2d11/stock',
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');

    const body = JSON.parse(response.payload);
    expect(body).toHaveProperty('data');
    expect(body.data).toMatchObject({
      productId: '8eaa43ac-6e71-4fe8-9ea3-2b5e4e3f2d11',
      omieCode: '12345',
      quantity: '10.0000',
      stockQuantity: '10.0000',
      minimum: '2.0000',
      minimumStock: '2.0000',
      reported: true,
      rawQuantity: '10.0000',
      rawMinimum: '2.0000',
      capturedAt: '2026-04-14T12:00:00.000Z',
    });

    await app.close();
  });

  it('GET /v1/products/:id/stock - id inexistente retorna 404 e error.code', async () => {
    (prisma.product.findUnique as any).mockResolvedValue(null);

    const app = await buildApp();
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/v1/products/8eaa43ac-6e71-4fe8-9ea3-2b5e4e3f2d11/stock',
    });

    expect(response.statusCode).toBe(404);
    expect(response.headers['content-type']).toContain('application/json');

    const body = JSON.parse(response.payload);
    expect(body).toHaveProperty('error');
    expect(body.error.code).toBe('PRODUCT_NOT_FOUND');

    await app.close();
  });

  it('GET /v1/products/:id/stock - sem histórico retorna 404 STOCK_NOT_FOUND', async () => {
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

    (prisma.productStock.findMany as any).mockResolvedValue([]);

    const app = await buildApp();
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/v1/products/8eaa43ac-6e71-4fe8-9ea3-2b5e4e3f2d11/stock',
    });

    expect(response.statusCode).toBe(404);
    const body = JSON.parse(response.payload);
    expect(body.error.code).toBe('STOCK_NOT_FOUND');

    await app.close();
  });

  it('GET /v1/omie/products/by-code/:omieCode/stock - coalesce para 0.0000 quando ausente, mantendo reported=false e rawQuantity=null', async () => {
    (prisma.productStock.findMany as any).mockResolvedValue([
      {
        stockQuantity: null,
        minimumStock: null,
        capturedAt: new Date('2026-04-14T12:00:00.000Z'),
      },
    ]);

    const app = await buildApp();
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/v1/omie/products/by-code/222/stock',
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');

    const body = JSON.parse(response.payload);
    expect(body).toHaveProperty('data');
    expect(body.data).toMatchObject({
      omieCode: '222',
      quantity: '0.0000',
      stockQuantity: '0.0000',
      minimum: '0.0000',
      minimumStock: '0.0000',
      reported: false,
      rawQuantity: null,
      rawMinimum: null,
      capturedAt: '2026-04-14T12:00:00.000Z',
    });

    await app.close();
  });

  it('GET /v1/omie/products/by-code/:omieCode/stock - preserva valores negativos', async () => {
    (prisma.productStock.findMany as any).mockResolvedValue([
      {
        stockQuantity: '-2.5',
        minimumStock: '-1',
        capturedAt: new Date('2026-04-14T12:00:00.000Z'),
      },
    ]);

    const app = await buildApp();
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/v1/omie/products/by-code/111/stock',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.data).toMatchObject({
      omieCode: '111',
      quantity: '-2.5000',
      minimum: '-1.0000',
      reported: true,
      rawQuantity: '-2.5000',
      rawMinimum: '-1.0000',
      stockQuantity: '-2.5000',
      minimumStock: '-1.0000',
      capturedAt: '2026-04-14T12:00:00.000Z',
    });

    await app.close();
  });

  it('GET /v1/products/:id/stock/history - pagina e retorna { data, meta }', async () => {
    (prisma.product.findUnique as any).mockResolvedValue({
      id: '8eaa43ac-6e71-4fe8-9ea3-2b5e4e3f2d11',
      omieProductId: '0a74a47a-3b19-4f22-9b0f-8b8d41d8c6c6',
    });

    (prisma.omieProduct.findUnique as any).mockResolvedValue({
      omieCode: '12345',
      omieId: '12345',
      rawPayload: { codigo: '12345' },
    });

    (prisma.productStock.count as any).mockResolvedValue(3);
    (prisma.productStock.findMany as any).mockResolvedValue([
      { stockQuantity: '10', minimumStock: '2', capturedAt: new Date('2026-04-14T12:00:00.000Z') },
      { stockQuantity: '9', minimumStock: '2', capturedAt: new Date('2026-04-13T12:00:00.000Z') },
    ]);

    const app = await buildApp();
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/v1/products/8eaa43ac-6e71-4fe8-9ea3-2b5e4e3f2d11/stock/history?page=1&pageSize=2',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.meta).toEqual({ page: 1, pageSize: 2, total: 3 });
    expect(body.data).toHaveLength(2);
    expect(body.data[0]).toMatchObject({
      productId: '8eaa43ac-6e71-4fe8-9ea3-2b5e4e3f2d11',
      omieCode: '12345',
      quantity: '10.0000',
      stockQuantity: '10.0000',
      minimum: '2.0000',
      minimumStock: '2.0000',
      reported: true,
      rawQuantity: '10.0000',
      rawMinimum: '2.0000',
      capturedAt: '2026-04-14T12:00:00.000Z',
    });

    await app.close();
  });
});
