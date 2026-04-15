console.log("✅ omieProductSync.job.ts loaded");

import { prisma } from '../db';
import { omieClient } from '../integrations/omie/OmieClient';
import { OmieAdapter } from '../integrations/omie/OmieAdapter';
import { env } from '../env';
import { AppError } from '../core/errors/AppError';
import { acquireJobLock, releaseJobLock } from './jobLock.service';
import { calculateBackoffWithJitter, sleep } from '../utils/backoff';

const OMIE_PRODUCTS_PATH = 'geral/produtos/';
const OMIE_PRODUCTS_PAGE_SIZE = 100;
const OMIE_PRODUCTS_MAX_PAGES = 2000;
const JOB_LOCK_KEY = 'omie_product_sync';
const JOB_LOCK_TTL_MS = 10 * 60 * 1000;

type OmieProductNormalized = {
  omieCode: string;
  omieId: string | null;
  sku: string | null;
  description: string;
  familyDescription: string | null;
  active: boolean;
  rawPayload: unknown;
};

function buildFieldLengthSummary(item: {
  omieCode: string;
  description: string;
  sku: string | null;
  familyDescription: string | null;
}) {
  const safeLen = (value: string | null | undefined) => (value == null ? 0 : String(value).length);

  return {
    sample: {
      omieCode: item.omieCode,
      description: String(item.description ?? ''),
      sku: item.sku ? String(item.sku) : null,
      familyDescription: item.familyDescription ? String(item.familyDescription) : null,
    },
    length: {
      omieCode: safeLen(item.omieCode),
      description: safeLen(item.description),
      sku: safeLen(item.sku),
      familyDescription: safeLen(item.familyDescription),
    },
  };
}

function warnFieldLengthOutliers(item: {
  omieCode: string;
  omieId: string | null;
  sku: string | null;
  description: string;
  familyDescription: string | null;
}) {
  const omieCode = item.omieCode;

  const skuExpectedMax = 128;
  if (item.sku && item.sku.length > skuExpectedMax) {
    console.warn('⚠️ omie product sync: sku length outlier', {
      omieCode,
      len: item.sku.length,
      expectedMax: skuExpectedMax,
    });
  }

  const omieCodeExpectedMax = 64;
  if (item.omieCode && item.omieCode.length > omieCodeExpectedMax) {
    console.warn('⚠️ omie product sync: omieCode length outlier', {
      omieCode,
      len: item.omieCode.length,
      expectedMax: omieCodeExpectedMax,
    });
  }
}

function toTrimmedString(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const s = String(value).trim();
  return s.length > 0 ? s : null;
}

function normalizeDescription(value: unknown): string {
  return toTrimmedString(value) ?? 'Sem descrição';
}

function extractOmieCode(raw: any): string | null {
  return (
    toTrimmedString(raw?.codigo) ??
    toTrimmedString(raw?.cod_int) ??
    toTrimmedString(raw?.codigo_item) ??
    toTrimmedString(raw?.codigoItem) ??
    toTrimmedString(raw?.codInt) ??
    null
  );
}

function extractOmieId(raw: any): string | null {
  return (
    toTrimmedString(raw?.id) ??
    toTrimmedString(raw?.codigo_produto) ??
    toTrimmedString(raw?.codigoProduto) ??
    null
  );
}

function normalizeOmieProduct(raw: any): OmieProductNormalized | null {
  const omieCode = extractOmieCode(raw);
  if (!omieCode) return null;

  const omieId = extractOmieId(raw);
  const sku = toTrimmedString(raw?.sku);

  const descriptionRaw = raw?.descricao ?? raw?.descricao_produto ?? 'Sem descrição';
  const descriptionTrimmed = String(descriptionRaw).trim();
  const description = descriptionTrimmed.length > 0 ? descriptionTrimmed : 'Sem descrição';

  const familyDescriptionRaw = OmieAdapter.extractFamilyDescription(raw);
  const familyDescription = familyDescriptionRaw == null ? null : String(familyDescriptionRaw).trim() || null;

  const active = raw?.ativo !== undefined ? Boolean(raw.ativo) : true;

  return {
    omieCode: String(omieCode).trim(),
    omieId: omieId == null ? null : String(omieId).trim() || null,
    sku: sku == null ? null : String(sku).trim() || null,
    description,
    familyDescription,
    active,
    rawPayload: raw,
  };
}

function buildProductsPayload(page: number) {
  return {
    call: 'ListarProdutos',
    param: [
      {
        pagina: page,
        registros_por_pagina: OMIE_PRODUCTS_PAGE_SIZE,
        apenas_importado_api: 'N',
        filtrar_apenas_omiepdv: 'N',
      },
    ],
  };
}

function extractProductsResponseItems(data: any): any[] {
  return data?.produto_servico_cadastro ?? data?.produtos ?? data?.lista ?? data?.produto_servico ?? [];
}

function extractProductsTotalPages(data: any): number | null {
  const value = data?.total_de_paginas ?? data?.nTotPaginas ?? data?.nTotalPaginas ?? data?.total_paginas;

  if (value === undefined || value === null || value === '') {
    return null;
  }

  const totalPages = Number(value);
  return Number.isFinite(totalPages) && totalPages > 0 ? totalPages : null;
}

async function fetchProductsPage(page: number): Promise<any> {
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await omieClient.post<any>(OMIE_PRODUCTS_PATH, buildProductsPayload(page));
    } catch (error: any) {
      if (attempt >= maxAttempts) {
        if (error instanceof AppError) {
          throw new AppError(error.code, error.statusCode, error.message, {
            ...(error.details || {}),
            page,
            attempt,
          });
        }
        throw error;
      }

      await sleep(calculateBackoffWithJitter(attempt, 250, 200));
    }
  }

  throw new AppError('OMIE_PAGINATION_ERROR', 502, 'Falha ao paginar produtos no Omie', { page });
}

export async function runOmieProductSync(): Promise<{
  upsertedCount: number;
  updatedCount: number;
  deactivatedCount: number;
}> {
  console.log('🔥 runOmieProductSync ENTERED');

  console.log('🔐 attempting acquireJobLock: omie_product_sync');
  let lockAcquired = false;
  try {
    lockAcquired = await acquireJobLock(JOB_LOCK_KEY, JOB_LOCK_TTL_MS);
  } catch (err: any) {
    console.log('🔐 acquireJobLock threw:', err?.code ?? 'UNKNOWN', err?.message ?? String(err));
    throw err;
  }
  console.log('🔐 acquireJobLock result:', lockAcquired);

  if (!lockAcquired) {
    return { upsertedCount: 0, updatedCount: 0, deactivatedCount: 0 };
  }

  if (!env.OMIE_APP_KEY || !env.OMIE_APP_SECRET || !env.OMIE_BASE_URL) {
    throw new AppError('OMIE_NOT_CONFIGURED', 400, 'Omie não configurado');
  }

  const syncAt = new Date();

  let upsertedCount = 0;
  let updatedCount = 0;
  let deactivatedCount = 0;

  try {
    let page = 1;
    let totalPages: number | null = null;

    while (true) {
      if (page > OMIE_PRODUCTS_MAX_PAGES) {
        throw new AppError('OMIE_PAGINATION_OVERFLOW', 502, 'Paginação do Omie excedeu o limite de segurança', {
          page,
        });
      }

      const data = await fetchProductsPage(page);
      const items = extractProductsResponseItems(data);
      const reportedTotalPages = extractProductsTotalPages(data);

      if (reportedTotalPages && totalPages === null) {
        totalPages = reportedTotalPages;
      }

      if (items.length === 0) {
        break;
      }

      const normalizedItems = items.map(normalizeOmieProduct).filter((v): v is OmieProductNormalized => Boolean(v));
      const omieCodes = Array.from(new Set(normalizedItems.map((item) => item.omieCode)));

      const existingRows = await prisma.omieProduct.findMany({
        where: { omieCode: { in: omieCodes } },
        select: {
          omieCode: true,
          omieId: true,
          sku: true,
          description: true,
          familyDescription: true,
          active: true,
        },
      });

      const existingByOmieCode = new Map(existingRows.map((row) => [row.omieCode, row]));

      for (const item of normalizedItems) {
        warnFieldLengthOutliers(item);

        const existing = existingByOmieCode.get(item.omieCode);
        const omieCodeSample = item.omieCode;

        const changed =
          (existing?.omieId ?? null) !== (item.omieId ?? null) ||
          (existing?.sku ?? null) !== (item.sku ?? null) ||
          (existing?.description ?? null) !== item.description ||
          (existing?.familyDescription ?? null) !== (item.familyDescription ?? null) ||
          (existing?.active ?? null) !== item.active;

        if (!existing) {
          upsertedCount += 1;
        } else {
          if (existing.active && !item.active) {
            deactivatedCount += 1;
          }
          if (changed) {
            updatedCount += 1;
          }
        }

        try {
          await prisma.omieProduct.upsert({
            where: { omieCode: item.omieCode },
            create: {
              omieCode: item.omieCode,
              omieId: item.omieId,
              sku: item.sku,
              description: item.description,
              familyDescription: item.familyDescription,
              active: item.active,
              rawPayload: item.rawPayload as any,
              lastSyncAt: syncAt,
            },
            update: {
              omieId: item.omieId,
              sku: item.sku,
              description: item.description,
              familyDescription: item.familyDescription,
              active: item.active,
              rawPayload: item.rawPayload as any,
              lastSyncAt: syncAt,
            },
          } as any);
        } catch (err: any) {
          if (err?.code === 'P2000') {
            console.log('🚨 Prisma P2000 on OmieProduct.upsert', {
              modelName: err?.meta?.modelName,
              column_name: err?.meta?.column_name,
              omieCodeSample,
              fieldLengthSummary: buildFieldLengthSummary(item),
            });
          }
          throw err;
        }
      }

      if (totalPages != null) {
        if (page >= totalPages) {
          break;
        }
      } else if (items.length < OMIE_PRODUCTS_PAGE_SIZE) {
        break;
      }

      page += 1;
    }

    const deactivatedMissing = await prisma.omieProduct.updateMany({
      where: {
        active: true,
        lastSyncAt: { lt: syncAt },
      },
      data: {
        active: false,
        lastSyncAt: syncAt,
      },
    });

    deactivatedCount += deactivatedMissing.count;

    return {
      upsertedCount,
      updatedCount,
      deactivatedCount,
    };
  } finally {
    console.log('🔓 releaseJobLock: omie_product_sync');
    await releaseJobLock(JOB_LOCK_KEY);
  }
}

