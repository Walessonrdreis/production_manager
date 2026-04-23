import { prisma } from '../../infra/db';
import { omieClient } from '../integrations/omie/OmieClient';
import { OmieAdapter } from '../integrations/omie/OmieAdapter';
import { env } from '../../env';
import { AppError } from './errors/AppError';


const OMIE_PRODUCTS_PATH = "geral/produtos/";
const OMIE_PRODUCTS_PAGE_SIZE = 100;
const OMIE_PRODUCTS_MAX_PAGES = 2000;

let lastGlobalSyncAt: number = 0;
let inMemoryLockUntil = 0;
const THROTTLE_WINDOW_MS = 60 * 1000; // 60 segundos
const LOCK_WINDOW_MS = 2 * 60 * 1000;
const SYNC_LOCK_KEY = "omie_products_sync";

export class SyncOmieProductsService {
  private buildProductsPayload(page: number) {
    return {
      call: "ListarProdutos",
      param: [{
        pagina: page,
        registros_por_pagina: OMIE_PRODUCTS_PAGE_SIZE,
        apenas_importado_api: "N",
        filtrar_apenas_omiepdv: "N"
      }]
    };
  }

  private extractProductsResponseItems(data: any): any[] {
    return data?.produto_servico_cadastro ?? data?.produtos ?? data?.lista ?? data?.produto_servico ?? [];
  }

  private extractProductsTotalPages(data: any): number {
    const value =
      data?.total_de_paginas ??
      data?.nTotPaginas ??
      data?.nTotalPaginas ??
      data?.total_paginas;

    if (value === undefined || value === null || value === '') {
      return null as any;
    }

    const totalPages = Number(value);
    return Number.isFinite(totalPages) && totalPages > 0 ? totalPages : (null as any);
  }

  private async fetchProductsPage(page: number, requestId: string): Promise<any> {
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await omieClient.post<any>(OMIE_PRODUCTS_PATH, this.buildProductsPayload(page));
      } catch (error: any) {
        if (attempt >= maxAttempts) {
          if (error instanceof AppError) {
            throw new AppError(
              error.code,
              error.statusCode,
              error.message,
              { ...(error.details || {}), page, attempt, requestId }
            );
          }

          throw error;
        }

        console.warn(`omie page retry requestId=${requestId} page=${page} attempt=${attempt}`);
        await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
      }
    }

    throw new AppError('OMIE_PAGINATION_ERROR', 502, 'Falha ao paginar produtos no Omie', { page, requestId });
  }

  private isSyncLockTableUnavailable(error: any): boolean {
    return error?.code === 'P2021' || error?.code === 'P2022';
  }

  private acquireInMemoryLock(now: number): void {
    if (inMemoryLockUntil > now) {
      throw new AppError('SYNC_IN_PROGRESS', 409, 'Sincronização já em andamento');
    }

    inMemoryLockUntil = now + LOCK_WINDOW_MS;
  }

  private releaseInMemoryLock(): void {
    inMemoryLockUntil = 0;
  }

  async execute(requestId: string, force: boolean = false): Promise<{ upserted?: number, failed?: number, skipped?: boolean, reason?: string, nextAllowedInSec?: number }> {
    if (!env.OMIE_APP_KEY || !env.OMIE_APP_SECRET || !env.OMIE_BASE_URL) {
      throw new AppError('OMIE_NOT_CONFIGURED', 400, 'Omie não configurado');
    }

    const now = Date.now();
    const timeSinceLastSync = now - lastGlobalSyncAt;

    if (!force && timeSinceLastSync < THROTTLE_WINDOW_MS) {
      const nextAllowedInSec = Math.ceil((THROTTLE_WINDOW_MS - timeSinceLastSync) / 1000);
      console.log(`sync skipped requestId=${requestId} reason=SYNC_THROTTLED nextAllowedInSec=${nextAllowedInSec}`);
      return {
        skipped: true,
        reason: 'SYNC_THROTTLED',
        nextAllowedInSec,
      };
    }

    let lockAcquired = false;
    let usingInMemoryLock = false;

    try {
      let lock = await prisma.syncLock.findUnique({
        where: { key: SYNC_LOCK_KEY },
      });

      if (!lock) {
        try {
          lock = await prisma.syncLock.create({
            data: { key: SYNC_LOCK_KEY, lockedUntil: new Date(0) },
          });
        } catch (e: any) {
          // Captura caso alguém tenha acabado de criar
          if (e?.code === 'P2002') {
            throw new AppError('SYNC_IN_PROGRESS', 409, 'Sincronização já em andamento');
          }
          throw e;
        }
      }

      if (lock.lockedUntil.getTime() > now) {
        throw new AppError('SYNC_IN_PROGRESS', 409, 'Sincronização já em andamento');
      }

      // Tenta travar com segurança garantindo que ninguém travou no meio tempo
      const updated = await prisma.syncLock.updateMany({
        where: {
          key: SYNC_LOCK_KEY,
          lockedUntil: lock.lockedUntil,
        },
        data: { lockedUntil: new Date(now + LOCK_WINDOW_MS) },
      });

      if (updated.count === 0) {
        // Alguém travou milissegundos antes de nós
        throw new AppError('SYNC_IN_PROGRESS', 409, 'Sincronização já em andamento');
      }
      
      lockAcquired = true;
    } catch (dbError: any) {
      if (dbError instanceof AppError) {
        throw dbError;
      }

      if (this.isSyncLockTableUnavailable(dbError)) {
        this.acquireInMemoryLock(now);
        usingInMemoryLock = true;
        lockAcquired = true;
        console.warn(`sync lock fallback requestId=${requestId} strategy=in_memory prismaCode=${dbError?.code ?? 'UNKNOWN'}`);
      } else {
        console.error(`Falha ao obter lock do Prisma requestId=${requestId}`, dbError);
        throw new AppError(
          'SYNC_LOCK_DB_ERROR',
          503,
          'Falha ao acessar o lock de sincronização no banco',
          {
            prismaCode: dbError?.code,
            message: dbError?.message,
          }
        );
      }
    }

    const startTime = Date.now();
    console.log(`sync start requestId=${requestId}`);

    let upsertedCount = 0;
    let failedCount = 0;
    let pagesProcessed = 0;

    try {
      let page = 1;
      let totalPages: number | null = null;

      while (true) {
        if (page > OMIE_PRODUCTS_MAX_PAGES) {
          throw new AppError('OMIE_PAGINATION_OVERFLOW', 502, 'Paginação do Omie excedeu o limite de segurança', {
            page,
          });
        }

        const data = await this.fetchProductsPage(page, requestId);
        const items = this.extractProductsResponseItems(data);
        const reportedTotalPages = this.extractProductsTotalPages(data) as unknown as number | null;

        if (reportedTotalPages && totalPages === null) {
          totalPages = reportedTotalPages;
        }

        if (items.length === 0) {
          break;
        }

        for (const item of items) {
          let dto;
          try {
            dto = OmieAdapter.toProductDTO(item);
            
            const omieCode =
              String(item?.codigo ?? item?.cod_int ?? item?.codigo_item ?? dto?.omieId ?? '')
                .trim();

            if (!omieCode) {
              throw new AppError('OMIE_CODE_NOT_FOUND', 502, 'Omie code not found in payload');
            }

            const omieId =
              (item?.id ?? item?.codigo_produto) !== undefined && (item?.id ?? item?.codigo_produto) !== null
                ? String(item?.id ?? item?.codigo_produto).trim()
                : null;

            await prisma.omieProduct.upsert({
              where: { omieCode },
              create: {
                omieCode,
                omieId,
                sku: dto.sku,
                description: dto.description,
                familyDescription: OmieAdapter.extractFamilyDescription(dto.rawPayload),
                active: dto.active,
                rawPayload: dto.rawPayload,
                lastSyncAt: new Date(),
              },
              update: {
                omieId,
                sku: dto.sku,
                description: dto.description,
                familyDescription: OmieAdapter.extractFamilyDescription(dto.rawPayload),
                active: dto.active,
                rawPayload: dto.rawPayload,
                lastSyncAt: new Date(),
              },
            } as any);
            upsertedCount++;
          } catch (err: any) {
            failedCount++;
            const fallbackOmieId = dto?.omieId || item?.codigo_produto || item?.codigo || item?.id || 'DESCONHECIDO';
            
            console.error(JSON.stringify({
              event: "sync_item_failed",
              requestId,
              omieId: fallbackOmieId,
              errorMessage: err.message
            }));
          }
        }

        pagesProcessed += 1;

        if (totalPages) {
          if (page >= totalPages) {
            break;
          }
        } else {
          if (items.length < OMIE_PRODUCTS_PAGE_SIZE) {
            break;
          }
        }

        page += 1;
      }

      lastGlobalSyncAt = Date.now();

      const elapsedMs = Date.now() - startTime;
      console.log(`sync end requestId=${requestId} upserted=${upsertedCount} failed=${failedCount} pages=${pagesProcessed} ms=${elapsedMs}`);

      return { upserted: upsertedCount, failed: failedCount };
    } finally {
      if (lockAcquired) {
        if (usingInMemoryLock) {
          this.releaseInMemoryLock();
        } else {
          try {
            await prisma.syncLock.update({
              where: { key: SYNC_LOCK_KEY },
              data: { lockedUntil: new Date(0) },
            });
          } catch (releaseErr: any) {
             console.error(`Falha ao liberar lock do Prisma requestId=${requestId}`, releaseErr);
          }
        }
      }
    }
  }
}
