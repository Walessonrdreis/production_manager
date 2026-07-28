import { describe, it, expect, vi, beforeEach } from 'vitest';

type StoredRow = {
  omieCode: string;
  omieId: string | null;
  sku: string | null;
  description: string;
  familyDescription: string | null;
  active: boolean;
};

const store = new Map<string, StoredRow>();

vi.mock('../src/db', () => {
  return {
    prisma: {
      omieProduct: {
        findMany: vi.fn().mockImplementation(async ({ where }: any) => {
          const codes: string[] = where?.omieCode?.in ?? [];
          return codes
            .map((code) => store.get(code))
            .filter(Boolean)
            .map((row) => ({
              omieCode: row!.omieCode,
              omieId: row!.omieId,
              sku: row!.sku,
              description: row!.description,
              familyDescription: row!.familyDescription,
              active: row!.active,
            }));
        }),
        upsert: vi.fn().mockImplementation(async ({ where, create, update }: any) => {
          const key = where.omieCode as string;
          const exists = store.has(key);
          const data = exists ? { ...store.get(key)!, ...update } : create;
          store.set(key, {
            omieCode: data.omieCode,
            omieId: data.omieId ?? null,
            sku: data.sku ?? null,
            description: data.description,
            familyDescription: data.familyDescription ?? null,
            active: data.active,
          });
          return { id: exists ? 'updated' : 'created', ...store.get(key)! };
        }),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
    },
  };
});

vi.mock('../src/integrations/omie/OmieClient', () => {
  return {
    omieClient: {
      post: vi.fn(),
    },
  };
});

vi.mock('../src/services/jobLock.service', () => {
  return {
    acquireJobLock: vi.fn().mockResolvedValue(true),
    releaseJobLock: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock('../src/env', () => {
  return {
    env: {
      OMIE_APP_KEY: 'test',
      OMIE_APP_SECRET: 'test',
      OMIE_BASE_URL: 'https://example.test/',
      DATABASE_URL: 'postgres://user:pass@localhost:5432/db',
      PORT: 3333,
      CORS_ORIGIN: 'http://localhost:5173',
    },
  };
});

import { omieClient } from '../src/integrations/omie/OmieClient';
import { prisma } from '../src/db';
import { runOmieProductSync } from '../src/services/omieProductSync.service';

describe('runOmieProductSync - idempotência por omieCode', () => {
  beforeEach(() => {
    store.clear();
    vi.clearAllMocks();
  });

  it('executar duas vezes não duplica e atualiza omieId mantendo omieCode', async () => {
    (omieClient.post as any)
      .mockResolvedValueOnce({
        produto_servico_cadastro: [
          {
            id: '9116172831',
            codigo: 'XTE',
            sku: 'SKU-1',
            descricao: 'Produto X',
            descricao_familia: 'Familia',
            ativo: true,
          },
        ],
        total_de_paginas: 1,
      })
      .mockResolvedValueOnce({
        produto_servico_cadastro: [
          {
            id: '9220000000',
            codigo: 'XTE',
            sku: 'SKU-1',
            descricao: 'Produto X',
            descricao_familia: 'Familia',
            ativo: true,
          },
        ],
        total_de_paginas: 1,
      });

    const first = await runOmieProductSync();
    expect(first.upsertedCount).toBe(1);
    expect(store.size).toBe(1);
    expect(store.get('XTE')?.omieId).toBe('9116172831');

    const second = await runOmieProductSync();
    expect(second.upsertedCount).toBe(0);
    expect(second.updatedCount).toBe(1);
    expect(store.size).toBe(1);
    expect(store.get('XTE')?.omieId).toBe('9220000000');

    expect(prisma.omieProduct.upsert).toHaveBeenCalledTimes(2);
    expect((prisma.omieProduct.upsert as any).mock.calls[0][0].where).toEqual({ omieCode: 'XTE' });
    expect((prisma.omieProduct.upsert as any).mock.calls[1][0].where).toEqual({ omieCode: 'XTE' });
  });
});

