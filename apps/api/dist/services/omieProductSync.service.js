"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runOmieProductSync = runOmieProductSync;
console.log("✅ omieProductSync.job.ts loaded");
const db_1 = require("../db");
const OmieClient_1 = require("../integrations/omie/OmieClient");
const OmieAdapter_1 = require("../integrations/omie/OmieAdapter");
const env_1 = require("../env");
const AppError_1 = require("../core/errors/AppError");
const jobLock_service_1 = require("./jobLock.service");
const backoff_1 = require("../utils/backoff");
const OMIE_PRODUCTS_PATH = 'geral/produtos/';
const OMIE_PRODUCTS_PAGE_SIZE = 100;
const OMIE_PRODUCTS_MAX_PAGES = 2000;
const JOB_LOCK_KEY = 'omie_product_sync';
const JOB_LOCK_TTL_MS = 10 * 60 * 1000;
function buildFieldLengthSummary(item) {
    const safeLen = (value) => (value == null ? 0 : String(value).length);
    return {
        sample: {
            omieCode: item.omieCode ?? null,
            description: String(item.description ?? '').slice(0, 80),
            sku: item.sku ? String(item.sku).slice(0, 80) : null,
            familyDescription: item.familyDescription ? String(item.familyDescription).slice(0, 80) : null,
        },
        length: {
            omieCode: safeLen(item.omieCode),
            description: safeLen(item.description),
            sku: safeLen(item.sku),
            familyDescription: safeLen(item.familyDescription),
        },
    };
}
function toTrimmedString(value) {
    if (value === undefined || value === null)
        return null;
    const s = String(value).trim();
    return s.length > 0 ? s : null;
}
function normalizeDescription(value) {
    return toTrimmedString(value) ?? 'Sem descrição';
}
function extractOmieId(raw) {
    return (toTrimmedString(raw?.codigo_produto) ??
        toTrimmedString(raw?.id) ??
        toTrimmedString(raw?.codigo) ??
        toTrimmedString(raw?.codigo_item) ??
        toTrimmedString(OmieAdapter_1.OmieAdapter.extractProductCode(raw)));
}
function extractOmieCode(raw) {
    return (toTrimmedString(raw?.codigo) ??
        toTrimmedString(raw?.cod_int) ??
        toTrimmedString(raw?.codigo_item) ??
        toTrimmedString(raw?.codigo_produto) ??
        toTrimmedString(raw?.id) ??
        toTrimmedString(OmieAdapter_1.OmieAdapter.extractProductCode(raw)));
}
function normalizeOmieProduct(raw) {
    const omieId = extractOmieId(raw);
    if (!omieId)
        return null;
    const omieCode = extractOmieCode(raw);
    const sku = toTrimmedString(raw?.sku);
    const description = normalizeDescription(raw?.descricao ?? raw?.descricao_produto);
    const familyDescription = toTrimmedString(OmieAdapter_1.OmieAdapter.extractFamilyDescription(raw));
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
function buildProductsPayload(page) {
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
function extractProductsResponseItems(data) {
    return data?.produto_servico_cadastro ?? data?.produtos ?? data?.lista ?? data?.produto_servico ?? [];
}
function extractProductsTotalPages(data) {
    const value = data?.total_de_paginas ?? data?.nTotPaginas ?? data?.nTotalPaginas ?? data?.total_paginas;
    if (value === undefined || value === null || value === '') {
        return null;
    }
    const totalPages = Number(value);
    return Number.isFinite(totalPages) && totalPages > 0 ? totalPages : null;
}
async function fetchProductsPage(page) {
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await OmieClient_1.omieClient.post(OMIE_PRODUCTS_PATH, buildProductsPayload(page));
        }
        catch (error) {
            if (attempt >= maxAttempts) {
                if (error instanceof AppError_1.AppError) {
                    throw new AppError_1.AppError(error.code, error.statusCode, error.message, {
                        ...(error.details || {}),
                        page,
                        attempt,
                    });
                }
                throw error;
            }
            await (0, backoff_1.sleep)((0, backoff_1.calculateBackoffWithJitter)(attempt, 250, 200));
        }
    }
    throw new AppError_1.AppError('OMIE_PAGINATION_ERROR', 502, 'Falha ao paginar produtos no Omie', { page });
}
async function runOmieProductSync() {
    console.log('🔥 runOmieProductSync ENTERED');
    console.log('🔐 attempting acquireJobLock: omie_product_sync');
    let lockAcquired = false;
    try {
        lockAcquired = await (0, jobLock_service_1.acquireJobLock)(JOB_LOCK_KEY, JOB_LOCK_TTL_MS);
    }
    catch (err) {
        console.log('🔐 acquireJobLock threw:', err?.code ?? 'UNKNOWN', err?.message ?? String(err));
        throw err;
    }
    console.log('🔐 acquireJobLock result:', lockAcquired);
    if (!lockAcquired) {
        return { upsertedCount: 0, updatedCount: 0, deactivatedCount: 0 };
    }
    if (!env_1.env.OMIE_APP_KEY || !env_1.env.OMIE_APP_SECRET || !env_1.env.OMIE_BASE_URL) {
        throw new AppError_1.AppError('OMIE_NOT_CONFIGURED', 400, 'Omie não configurado');
    }
    const syncAt = new Date();
    let upsertedCount = 0;
    let updatedCount = 0;
    let deactivatedCount = 0;
    try {
        let page = 1;
        let totalPages = null;
        while (true) {
            if (page > OMIE_PRODUCTS_MAX_PAGES) {
                throw new AppError_1.AppError('OMIE_PAGINATION_OVERFLOW', 502, 'Paginação do Omie excedeu o limite de segurança', {
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
            const normalizedItems = items.map(normalizeOmieProduct).filter((v) => Boolean(v));
            const omieIds = normalizedItems.map((item) => item.omieId);
            const existingRows = await db_1.prisma.omieProduct.findMany({
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
                const omieCodeSample = item.omieCode ?? item.omieId;
                if (!existing) {
                    try {
                        await db_1.prisma.omieProduct.create({
                            data: {
                                omieId: item.omieId,
                                omieCode: item.omieCode,
                                sku: item.sku,
                                description: item.description,
                                familyDescription: item.familyDescription,
                                active: item.active,
                                rawPayload: item.rawPayload,
                                lastSyncAt: syncAt,
                            },
                        });
                    }
                    catch (err) {
                        if (err?.code === 'P2000') {
                            console.log('🚨 Prisma P2000 on OmieProduct.create', {
                                modelName: err?.meta?.modelName,
                                column_name: err?.meta?.column_name,
                                omieCodeSample,
                                fieldLengthSummary: buildFieldLengthSummary(item),
                            });
                        }
                        throw err;
                    }
                    upsertedCount += 1;
                    continue;
                }
                const changed = (existing.omieCode ?? null) !== (item.omieCode ?? null) ||
                    (existing.sku ?? null) !== (item.sku ?? null) ||
                    existing.description !== item.description ||
                    (existing.familyDescription ?? null) !== (item.familyDescription ?? null) ||
                    existing.active !== item.active;
                if (existing.active && !item.active) {
                    deactivatedCount += 1;
                }
                try {
                    await db_1.prisma.omieProduct.update({
                        where: { omieId: item.omieId },
                        data: {
                            omieCode: item.omieCode,
                            sku: item.sku,
                            description: item.description,
                            familyDescription: item.familyDescription,
                            active: item.active,
                            rawPayload: item.rawPayload,
                            lastSyncAt: syncAt,
                        },
                    });
                }
                catch (err) {
                    if (err?.code === 'P2000') {
                        console.log('🚨 Prisma P2000 on OmieProduct.update', {
                            modelName: err?.meta?.modelName,
                            column_name: err?.meta?.column_name,
                            omieCodeSample,
                            fieldLengthSummary: buildFieldLengthSummary(item),
                        });
                    }
                    throw err;
                }
                if (changed) {
                    updatedCount += 1;
                }
            }
            if (totalPages != null) {
                if (page >= totalPages) {
                    break;
                }
            }
            else if (items.length < OMIE_PRODUCTS_PAGE_SIZE) {
                break;
            }
            page += 1;
        }
        const deactivatedMissing = await db_1.prisma.omieProduct.updateMany({
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
    }
    finally {
        console.log('🔓 releaseJobLock: omie_product_sync');
        await (0, jobLock_service_1.releaseJobLock)(JOB_LOCK_KEY);
    }
}
