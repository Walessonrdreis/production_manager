"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncOmieProductsService = void 0;
const db_1 = require("../db");
const OmieClient_1 = require("../integrations/omie/OmieClient");
const OmieAdapter_1 = require("../integrations/omie/OmieAdapter");
const env_1 = require("../env");
const AppError_1 = require("./errors/AppError");
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
let lastGlobalSyncAt = 0;
let inMemoryLockUntil = 0;
const THROTTLE_WINDOW_MS = 60 * 1000; // 60 segundos
const LOCK_WINDOW_MS = 2 * 60 * 1000;
const SYNC_LOCK_KEY = "omie_products_sync";
class SyncOmieProductsService {
    isSyncLockTableUnavailable(error) {
        return error?.code === 'P2021' || error?.code === 'P2022';
    }
    acquireInMemoryLock(now) {
        if (inMemoryLockUntil > now) {
            throw new AppError_1.AppError('SYNC_IN_PROGRESS', 409, 'Sincronização já em andamento');
        }
        inMemoryLockUntil = now + LOCK_WINDOW_MS;
    }
    releaseInMemoryLock() {
        inMemoryLockUntil = 0;
    }
    async execute(requestId, force = false) {
        if (!env_1.env.OMIE_APP_KEY || !env_1.env.OMIE_APP_SECRET || !env_1.env.OMIE_BASE_URL) {
            throw new AppError_1.AppError('OMIE_NOT_CONFIGURED', 400, 'Omie não configurado');
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
            let lock = await db_1.prisma.syncLock.findUnique({
                where: { key: SYNC_LOCK_KEY },
            });
            if (!lock) {
                try {
                    lock = await db_1.prisma.syncLock.create({
                        data: { key: SYNC_LOCK_KEY, lockedUntil: new Date(0) },
                    });
                }
                catch (e) {
                    // Captura caso alguém tenha acabado de criar
                    if (e?.code === 'P2002') {
                        throw new AppError_1.AppError('SYNC_IN_PROGRESS', 409, 'Sincronização já em andamento');
                    }
                    throw e;
                }
            }
            if (lock.lockedUntil.getTime() > now) {
                throw new AppError_1.AppError('SYNC_IN_PROGRESS', 409, 'Sincronização já em andamento');
            }
            // Tenta travar com segurança garantindo que ninguém travou no meio tempo
            const updated = await db_1.prisma.syncLock.updateMany({
                where: {
                    key: SYNC_LOCK_KEY,
                    lockedUntil: lock.lockedUntil,
                },
                data: { lockedUntil: new Date(now + LOCK_WINDOW_MS) },
            });
            if (updated.count === 0) {
                // Alguém travou milissegundos antes de nós
                throw new AppError_1.AppError('SYNC_IN_PROGRESS', 409, 'Sincronização já em andamento');
            }
            lockAcquired = true;
        }
        catch (dbError) {
            if (dbError instanceof AppError_1.AppError) {
                throw dbError;
            }
            if (this.isSyncLockTableUnavailable(dbError)) {
                this.acquireInMemoryLock(now);
                usingInMemoryLock = true;
                lockAcquired = true;
                console.warn(`sync lock fallback requestId=${requestId} strategy=in_memory prismaCode=${dbError?.code ?? 'UNKNOWN'}`);
            }
            else {
                console.error(`Falha ao obter lock do Prisma requestId=${requestId}`, dbError);
                throw new AppError_1.AppError('SYNC_LOCK_DB_ERROR', 503, 'Falha ao acessar o lock de sincronização no banco', {
                    prismaCode: dbError?.code,
                    message: dbError?.message,
                });
            }
        }
        const startTime = Date.now();
        console.log(`sync start requestId=${requestId}`);
        let data;
        let upsertedCount = 0;
        let failedCount = 0;
        try {
            // 2. Chama a Omie via client
            data = await OmieClient_1.omieClient.post(OMIE_PRODUCTS_PATH, OMIE_PRODUCTS_PAYLOAD);
            // 3. Extrai items do payload
            const items = data.produtos ?? data.lista ?? [];
            for (const item of items) {
                let dto;
                try {
                    dto = OmieAdapter_1.OmieAdapter.toProductDTO(item);
                    await db_1.prisma.omieProduct.upsert({
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
                }
                catch (err) {
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
        }
        finally {
            if (lockAcquired) {
                if (usingInMemoryLock) {
                    this.releaseInMemoryLock();
                }
                else {
                    try {
                        await db_1.prisma.syncLock.update({
                            where: { key: SYNC_LOCK_KEY },
                            data: { lockedUntil: new Date(0) },
                        });
                    }
                    catch (releaseErr) {
                        console.error(`Falha ao liberar lock do Prisma requestId=${requestId}`, releaseErr);
                    }
                }
            }
        }
    }
}
exports.SyncOmieProductsService = SyncOmieProductsService;
