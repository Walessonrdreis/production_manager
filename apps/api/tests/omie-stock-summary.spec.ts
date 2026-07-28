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
      $queryRaw: vi.fn(),
    },
  };
});

import { buildApp } from '../src/app';
import { prisma } from '../src/db';

describe('GET /v1/omie/stock', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('retorna lastRefreshAt, totalItems e source=database', async () => {
    (prisma.$queryRaw as any).mockResolvedValue([
      { lastRefreshAt: new Date('2026-04-14T12:00:00.000Z'), totalItems: BigInt(2) },
    ]);

    const app = await buildApp();
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/v1/omie/stock',
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');

    const body = JSON.parse(response.payload);
    expect(body).toEqual({
      data: {
        lastRefreshAt: '2026-04-14T12:00:00.000Z',
        totalItems: 2,
        source: 'database',
      },
    });

    await app.close();
  });

  it('retorna 200 com lastRefreshAt=null e totalItems=0 quando não há dados', async () => {
    (prisma.$queryRaw as any).mockResolvedValue([
      { lastRefreshAt: null, totalItems: BigInt(0) },
    ]);

    const app = await buildApp();
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/v1/omie/stock',
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');

    const body = JSON.parse(response.payload);
    expect(body).toEqual({
      data: {
        lastRefreshAt: null,
        totalItems: 0,
        source: 'database',
      },
    });

    await app.close();
  });
});
