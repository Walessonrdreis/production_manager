"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.acquireJobLock = acquireJobLock;
exports.releaseJobLock = releaseJobLock;
const db_1 = require("../db");
async function acquireJobLock(key, ttlMs) {
    const now = new Date();
    const lockedUntil = new Date(now.getTime() + ttlMs);
    try {
        return await db_1.prisma.$transaction(async (tx) => {
            const existing = await tx.jobLock.findUnique({
                where: { key },
                select: { key: true, lockedUntil: true },
            });
            if (!existing) {
                await tx.jobLock.create({
                    data: {
                        key,
                        lockedUntil,
                    },
                });
                return true;
            }
            if (existing.lockedUntil < now) {
                await tx.jobLock.update({
                    where: { key },
                    data: { lockedUntil },
                });
                return true;
            }
            return false;
        });
    }
    catch (err) {
        // Corrida de criação/atualização em execuções concorrentes:
        // não adquirir lock não é erro de fluxo, deve retornar false.
        if (err?.code === 'P2002' || err?.code === 'P2025') {
            return false;
        }
        throw err;
    }
}
async function releaseJobLock(key) {
    const now = new Date();
    await db_1.prisma.$transaction(async (tx) => {
        await tx.jobLock.updateMany({
            where: { key },
            data: { lockedUntil: now },
        });
    });
}
