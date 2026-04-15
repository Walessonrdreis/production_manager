import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';

function loadOmieProductFieldLimitsFromSchema(): {
  omieCodeMax: number | null;
  skuMax: number | null;
  descriptionText: boolean;
  familyDescriptionText: boolean;
} {
  const schemaPath = path.resolve(__dirname, '../prisma/schema.prisma');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  const omieCodeMatch = schema.match(/omieCode\s+String\s+@db\.VarChar\((\d+)\)/);
  const skuMatch = schema.match(/sku\s+String\?\s+@db\.VarChar\((\d+)\)/);

  return {
    omieCodeMax: omieCodeMatch ? Number(omieCodeMatch[1]) : null,
    skuMax: skuMatch ? Number(skuMatch[1]) : null,
    descriptionText: /description\s+String\s+@db\.Text/.test(schema),
    familyDescriptionText: /familyDescription\s+String\?\s+@db\.Text/.test(schema),
  };
}

function buildP2000(modelName: string, column_name: string) {
  return {
    name: 'PrismaClientKnownRequestError',
    code: 'P2000',
    meta: { modelName, column_name },
    message: 'The provided value for the column is too long for the column\'s type.',
  };
}

vi.mock('../src/db', () => {
  const limits = loadOmieProductFieldLimitsFromSchema();

  return {
    prisma: {
      omieProduct: {
        findMany: vi.fn().mockResolvedValue([]),
        upsert: vi.fn().mockImplementation(async ({ create }: any) => {
          if (limits.omieCodeMax != null && create.omieCode && String(create.omieCode).length > limits.omieCodeMax) {
            throw buildP2000('OmieProduct', 'omieCode');
          }

          if (limits.skuMax != null && create.sku && String(create.sku).length > limits.skuMax) {
            throw buildP2000('OmieProduct', 'sku');
          }

          if (!limits.descriptionText && create.description && String(create.description).length > 255) {
            throw buildP2000('OmieProduct', 'description');
          }

          if (!limits.familyDescriptionText && create.familyDescription && String(create.familyDescription).length > 255) {
            throw buildP2000('OmieProduct', 'familyDescription');
          }

          return { id: 'created' };
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
import { acquireJobLock, releaseJobLock } from '../src/services/jobLock.service';
import { runOmieProductSync } from '../src/services/omieProductSync.service';

describe('runOmieProductSync - long fields', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (acquireJobLock as any).mockResolvedValue(true);
    (releaseJobLock as any).mockResolvedValue(undefined);
    (prisma.omieProduct.findMany as any).mockResolvedValue([]);
    (prisma.omieProduct.updateMany as any).mockResolvedValue({ count: 0 });
  });

  it('persiste strings longas sem lançar P2000 (schema widened)', async () => {
    const longDescription = `  ${'D'.repeat(1000)}  `;
    const longFamily = ` ${'F'.repeat(600)} `;
    const longSku = ` ${'S'.repeat(120)} `;

    (omieClient.post as any).mockResolvedValueOnce({
      produto_servico_cadastro: [
        {
          codigo: '12345',
          sku: longSku,
          descricao: longDescription,
          descricao_familia: longFamily,
          ativo: true,
        },
      ],
      total_de_paginas: 1,
    });

    const result = await runOmieProductSync();

    expect(result).toEqual({
      upsertedCount: 1,
      updatedCount: 0,
      deactivatedCount: 0,
    });

    expect(prisma.omieProduct.upsert).toHaveBeenCalledTimes(1);

    const upsertArg = (prisma.omieProduct.upsert as any).mock.calls[0]?.[0];
    expect(upsertArg.create.description.length).toBe(1000);
    expect(upsertArg.create.familyDescription.length).toBe(600);
    expect(upsertArg.create.sku.length).toBe(120);
  });
});
