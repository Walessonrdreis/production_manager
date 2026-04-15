"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.acquireJobLock = acquireJobLock;
exports.releaseJobLock = releaseJobLock;
const db_1 = require("../db");
async function acquireJobLock(key, ttlMs) {
    const now = new Date();
    const lockedUntil = new Date(now.getTime() + ttlMs);
    try {
        const rows = await db_1.prisma.$queryRaw `
      INSERT INTO "job_lock" ("key", "lockedUntil", "updatedAt")
      VALUES (${key}, ${lockedUntil}, ${now})
      ON CONFLICT ("key")
      DO UPDATE SET
        "lockedUntil" = EXCLUDED."lockedUntil",
        "updatedAt" = EXCLUDED."updatedAt"
      WHERE "job_lock"."lockedUntil" < ${now}
      RETURNING "key"
    `;
        return rows.length > 0;
    }
    catch (err) {
        throw err;
    }
}
async function releaseJobLock(key) {
    const now = new Date();
    await db_1.prisma.$executeRaw `
    UPDATE "job_lock"
    SET "lockedUntil" = ${now}, "updatedAt" = ${now}
    WHERE "key" = ${key}
  `;
}
