import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/services/omieProductSync.service', () => {
  return {
    runOmieProductSync: vi.fn(),
  };
});

import { buildApp } from '../src/app';
import { runOmieProductSync } from '../src/services/omieProductSync.service';

describe('POST /v1/omie/products/sync', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('retorna envelope { data } com contadores', async () => {
    (runOmieProductSync as any).mockResolvedValue({
      upsertedCount: 10,
      updatedCount: 7,
      deactivatedCount: 3,
    });

    const app = await buildApp();
    await app.ready();

    const response = await app.inject({
      method: 'POST',
      url: '/v1/omie/products/sync',
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');

    const body = JSON.parse(response.payload);
    expect(body).toEqual({
      data: {
        upsertedCount: 10,
        updatedCount: 7,
        deactivatedCount: 3,
      },
    });

    await app.close();
  });
});

