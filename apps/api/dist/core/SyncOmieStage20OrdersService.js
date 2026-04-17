"use strict";
// apps/api/src/core/SyncOmieStage20OrdersService.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncOmieStage20OrdersService = void 0;
const db_1 = require("../db");
const OmieClient_1 = require("../integrations/omie/OmieClient");
const omie_constants_1 = require("../integrations/omie/omie.constants");
const OmieOrdersAdapter_1 = require("../integrations/omie/OmieOrdersAdapter");
const AppError_1 = require("./errors/AppError");
class SyncOmieStage20OrdersService {
    LOCK_KEY = 'omie:orders:stage20:sync';
    LOCK_TTL_MS = 5 * 60 * 1000;
    PAGE_SIZE = 50;
    // ✅ padrão interno (não depende de env de path/call)
    OMIE_PATH = omie_constants_1.OMIE_ENDPOINTS.PEDIDOS_VENDA_PRODUTOS.path;
    OMIE_CALL = omie_constants_1.OMIE_ENDPOINTS.PEDIDOS_VENDA_PRODUTOS.call;
    resolvedOmieEndpoint = null;
    async run() {
        const lock = await this.acquireLock();
        if (!lock.acquired) {
            return {
                ok: true,
                reason: 'LOCKED',
                lockedUntil: lock.lockedUntil,
                syncedOrders: 0,
                skippedOrders: 0,
                pages: 0,
            };
        }
        let page = 1;
        let totalPages = 1;
        let syncedOrders = 0;
        let skippedOrders = 0;
        try {
            do {
                const resp = await this.listOrdersPage(page, this.PAGE_SIZE);
                totalPages = Number(resp?.total_de_paginas ?? 1);
                const pedidos = resp?.pedido_venda_produto ?? [];
                for (const pedido of pedidos) {
                    if (!(0, OmieOrdersAdapter_1.isEligibleStage20)(pedido)) {
                        skippedOrders++;
                        continue;
                    }
                    const { order, items } = (0, OmieOrdersAdapter_1.mapOrder)(pedido);
                    const validItems = items.filter((i) => i?.omieItemCode &&
                        i?.description &&
                        String(i.description).trim().length > 0);
                    await db_1.prisma.$transaction(async (tx) => {
                        const savedOrder = await tx.omieOrder.upsert({
                            where: { omieCode: order.omieCode },
                            create: order,
                            update: order,
                            select: { id: true },
                        });
                        for (const it of validItems) {
                            await tx.omieOrderItem.upsert({
                                where: { omieItemCode: it.omieItemCode },
                                create: { ...it, omieOrderId: savedOrder.id },
                                update: { ...it, omieOrderId: savedOrder.id },
                            });
                        }
                    });
                    syncedOrders++;
                }
                await this.renewLock();
                page++;
            } while (page <= totalPages);
            return {
                ok: true,
                reason: 'DONE',
                syncedOrders,
                skippedOrders,
                pages: totalPages,
                ...(this.resolvedOmieEndpoint ? { omieEndpoint: this.resolvedOmieEndpoint } : {}),
            };
        }
        catch (err) {
            if (err instanceof AppError_1.AppError)
                throw err;
            throw new AppError_1.AppError('OMIE_STAGE20_ORDERS_SYNC_FAILED', 500, 'Falha ao sincronizar pedidos etapa 20', { message: err?.message });
        }
        finally {
            await this.releaseLock();
        }
    }
    async listOrdersPage(page, pageSize) {
        try {
            const candidates = [
                { path: this.OMIE_PATH, call: this.OMIE_CALL },
                { path: 'produtos/pedido/', call: 'ListarPedidos' },
            ];
            for (const candidate of candidates) {
                const paramCandidates = [
                    { pagina: page, registros_por_pagina: pageSize, etapa: '20' },
                    { pagina: page, registros_por_pagina: pageSize },
                ];
                for (const param of paramCandidates) {
                    const payload = {
                        call: candidate.call,
                        param: [param],
                    };
                    try {
                        const resp = await OmieClient_1.omieClient.post(candidate.path, payload);
                        if (!this.resolvedOmieEndpoint) {
                            this.resolvedOmieEndpoint = { path: candidate.path, call: candidate.call };
                        }
                        return resp;
                    }
                    catch (err) {
                        const isHttpError = err instanceof AppError_1.AppError && err.code === 'OMIE_HTTP_ERROR';
                        const httpStatus = isHttpError ? err.details?.httpStatus : undefined;
                        const body = isHttpError ? String(err.details?.body ?? '') : '';
                        const methodNotExists = body.toLowerCase().includes('not exists') || body.toLowerCase().includes('não existe');
                        if (isHttpError && (httpStatus === 404 || methodNotExists)) {
                            break;
                        }
                        if (isHttpError && httpStatus === 500 && body.toLowerCase().includes('invalid')) {
                            continue;
                        }
                        throw err;
                    }
                }
            }
            throw new AppError_1.AppError('OMIE_LIST_ORDERS_FAILED', 502, 'Falha ao listar pedidos do Omie', {
                attempts: candidates.map((c) => ({ path: c.path, call: c.call })),
            });
        }
        catch (err) {
            if (err instanceof AppError_1.AppError)
                throw err;
            throw new AppError_1.AppError('OMIE_LIST_ORDERS_FAILED', 502, 'Falha ao listar pedidos do Omie', { message: err?.message });
        }
    }
    // ------------------------
    // LOCK via JobLock (tabela job_lock)
    // ------------------------
    async acquireLock() {
        const now = new Date();
        const lockedUntil = new Date(now.getTime() + this.LOCK_TTL_MS);
        try {
            await db_1.prisma.jobLock.create({
                data: { key: this.LOCK_KEY, lockedUntil },
            });
            return { acquired: true, lockedUntil };
        }
        catch {
            const existing = await db_1.prisma.jobLock.findUnique({
                where: { key: this.LOCK_KEY },
            });
            if (!existing)
                return { acquired: false };
            if (existing.lockedUntil <= now) {
                await db_1.prisma.jobLock.update({
                    where: { key: this.LOCK_KEY },
                    data: { lockedUntil },
                });
                return { acquired: true, lockedUntil };
            }
            return { acquired: false, lockedUntil: existing.lockedUntil };
        }
    }
    async renewLock() {
        const lockedUntil = new Date(Date.now() + this.LOCK_TTL_MS);
        await db_1.prisma.jobLock.updateMany({
            where: { key: this.LOCK_KEY },
            data: { lockedUntil },
        });
    }
    async releaseLock() {
        await db_1.prisma.jobLock.deleteMany({ where: { key: this.LOCK_KEY } });
    }
}
exports.SyncOmieStage20OrdersService = SyncOmieStage20OrdersService;
