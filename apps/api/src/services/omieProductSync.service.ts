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
  omieId: string;
  omieCode: string | null;
  sku: string | null;
  description: string;
  familyDescription: string | null;
  active: boolean;
  rawPayload: unknown;
};

function toTrimmedString(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const s = String(value).trim();
  return s.length > 0 ? s : null;
}

function normalizeDescription(value: unknown): string {
  return toTrimmedString(value) ?? 'Sem descrição';
}

function extractOmieId(raw: any): string | null {
  return (
    toTrimmedString(raw?.codigo_produto) ??
    toTrimmedString(raw?.id) ??
    toTrimmedString(raw?.codigo) ??
    toTrimmedString(raw?.codigo_item) ??
    toTrimmedString(OmieAdapter.extractProductCode(raw))
  );
}

function extractOmieCode(raw: any): string | null {
  return (
    toTrimmedString(raw?.codigo) ??
    toTrimmedString(raw?.cod_int) ??
    toTrimmedString(raw?.codigo_item) ??
    toTrimmedString(raw?.codigo_produto) ??
    toTrimmedString(raw?.id) ??
    toTrimmedString(OmieAdapter.extractProductCode(raw))
  );
}

function normalizeOmieProduct(raw: any): OmieProductNormalized | null {
  const omieId = extractOmieId(raw);
  if (!omieId) return null;

  const omieCode = extractOmieCode(raw);
  const sku = toTrimmedString(raw?.sku);
  const description = normalizeDescription(raw?.descricao ?? raw?.descricao_produto);
  const familyDescription = toTrimmedString(OmieAdapter.extractFamilyDescription(raw));
  const active = raw?.ativo !== undefined ? Boolean(raw.ativo) : true;

  return {
    omieId,
    omieCode,
    sku,
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
      const omieIds = normalizedItems.map((item) => item.omieId);

      const existingRows = await prisma.omieProduct.findMany({
        where: { omieId: { in: omieIds } },
        select: {
          omieId: true,
          omieCode: true,
          sku: true,
          description: true,
          familyDescription: true,
          active: true,
        },
      });

      const existingByOmieId = new Map(existingRows.map((row) => [row.omieId, row]));

      for (const item of normalizedItems) {
        const existing = existingByOmieId.get(item.omieId);

        if (!existing) {
          await prisma.omieProduct.create({
            data: {
              omieId: item.omieId,
              omieCode: item.omieCode,
              sku: item.sku,
              description: item.description,
              familyDescription: item.familyDescription,
              active: item.active,
              rawPayload: item.rawPayload as any,
              lastSyncAt: syncAt,
            },
          });

          upsertedCount += 1;
          continue;
        }

        const changed =
          (existing.omieCode ?? null) !== (item.omieCode ?? null) ||
          (existing.sku ?? null) !== (item.sku ?? null) ||
          existing.description !== item.description ||
          (existing.familyDescription ?? null) !== (item.familyDescription ?? null) ||
          existing.active !== item.active;

        if (existing.active && !item.active) {
          deactivatedCount += 1;
        }

        await prisma.omieProduct.update({
          where: { omieId: item.omieId },
          data: {
            omieCode: item.omieCode,
            sku: item.sku,
            description: item.description,
            familyDescription: item.familyDescription,
            active: item.active,
            rawPayload: item.rawPayload as any,
            lastSyncAt: syncAt,
          },
        });

        if (changed) {
          updatedCount += 1;
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

