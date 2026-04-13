import { prisma } from '../db';
import { omieClient } from '../integrations/omie/OmieClient';
import { OmieAdapter } from '../integrations/omie/OmieAdapter';
import { env } from '../env';
import { AppError } from './errors/AppError';

const OMIE_PRODUCTS_PATH = "geral/produtos/";
const OMIE_PRODUCTS_PAGE_SIZE = 500;

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
    return data?.produtos ?? data?.lista ?? [];
  }

  private extractProductsTotalPages(data: any): number {
    const totalPages = Number(
      data?.total_de_paginas ??
      data?.nTotPaginas ??
      data?.nTotalPaginas ??
      data?.total_paginas ??
      1
    );

    return Number.isFinite(totalPages) && totalPages > 0 ? totalPages : 1;
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

    try {
      let page = 1;
      let totalPages = 1;

      do {
        const data = await omieClient.post<any>(OMIE_PRODUCTS_PATH, this.buildProductsPayload(page));
        const items = this.extractProductsResponseItems(data);
        totalPages = this.extractProductsTotalPages(data);

        for (const item of items) {
          let dto;
          try {
            dto = OmieAdapter.toProductDTO(item);
            
            await prisma.omieProduct.upsert({
              where: { omieId: dto.omieId },
              create: {
                omieId: dto.omieId,
                sku: dto.sku,
                description: dto.description,
                active: dto.active,
                rawPayload: dto.rawPayload,
                lastSyncAt: new Date(),
              },
              update: {
                sku: dto.sku,
                description: dto.description,
                active: dto.active,
                rawPayload: dto.rawPayload,
                lastSyncAt: new Date(),
              },
            });
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

        page += 1;
      } while (page <= totalPages);

      lastGlobalSyncAt = Date.now();

      const elapsedMs = Date.now() - startTime;
      console.log(`sync end requestId=${requestId} upserted=${upsertedCount} failed=${failedCount} ms=${elapsedMs}`);

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
