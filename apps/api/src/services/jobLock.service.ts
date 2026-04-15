import { prisma } from '../db';

export async function acquireJobLock(key: string, ttlMs: number): Promise<boolean> {
  const now = new Date();
  const lockedUntil = new Date(now.getTime() + ttlMs);

  try {
    const rows = await prisma.$queryRaw<Array<{ key: string }>>`
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
  } catch (err: any) {
    throw err;
  }
}

export async function releaseJobLock(key: string): Promise<void> {
  const now = new Date();

  await prisma.$executeRaw`
    UPDATE "job_lock"
    SET "lockedUntil" = ${now}, "updatedAt" = ${now}
    WHERE "key" = ${key}
  `;
}
