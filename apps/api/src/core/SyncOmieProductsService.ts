import { prisma } from '../db';
import { omieClient } from '../integrations/omie/OmieClient';
import { OmieAdapter } from '../integrations/omie/OmieAdapter';
import { env } from '../env';
import { AppError } from './errors/AppError';

const OMIE_PRODUCTS_PATH = "geral/produtos/";

const OMIE_PRODUCTS_PAYLOAD = {
  call: "ListarProdutos",
  param: [{
    pagina: 1,
    registros_por_pagina: 100,
    apenas_importado_api: "N",
    filtrar_apenas_omiepdv: "N"
  }]
};

// Variável em memória para guardar a data do último sync global
let lastGlobalSyncAt: number = 0;
const THROTTLE_WINDOW_MS = 60 * 1000; // 60 segundos
const SYNC_LOCK_KEY = "omie_products_sync";

export class SyncOmieProductsService {
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

    // Abordagem Segura e Simplificada de Concorrência (Optimistic Locking)
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
          // Garante que só atualiza se a data for EXATAMENTE a que nós vimos
          lockedUntil: lock.lockedUntil,
        },
        data: { lockedUntil: new Date(now + 2 * 60 * 1000) },
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
      
      console.error(`Falha ao obter lock do Prisma requestId=${requestId}`, dbError);
      throw new AppError('INTERNAL_ERROR', 500, 'Erro de comunicação com o banco de dados ao tentar travar sincronização');
    }

    const startTime = Date.now();
    console.log(`sync start requestId=${requestId}`);

    let data;
    let upsertedCount = 0;
    let failedCount = 0;

    try {
      // 2. Chama a Omie via client
      data = await omieClient.post<any>(OMIE_PRODUCTS_PATH, OMIE_PRODUCTS_PAYLOAD);

      // 3. Extrai items do payload
      const items = data.produtos ?? data.lista ?? [];
      
      // 4. Upsert para cada item de forma resiliente
      for (const item of items) {
        let dto;
        try {
          // Extração dos dados pelo adapter pode falhar dependendo do formato do payload
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

      // Atualiza o tempo do último sync de sucesso em memória
      lastGlobalSyncAt = Date.now();

      const elapsedMs = Date.now() - startTime;
      console.log(`sync end requestId=${requestId} upserted=${upsertedCount} failed=${failedCount} ms=${elapsedMs}`);

      return { upserted: upsertedCount, failed: failedCount };
    } finally {
      // 5. Libera o lock distribuído (somente se eu o tiver adquirido com sucesso)
      if (lockAcquired) {
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
