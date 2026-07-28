// src/shared/utils/job-lock.ts
import type { Prisma } from "@prisma/client";

export type JobLockAcquireResult = {
  acquired: boolean;
  lockedUntil?: Date;
};

export function createJobLock(prisma: any) {
  return {
    async acquire(key: string, ttlMs: number): Promise<JobLockAcquireResult> {
      const now = new Date();
      const lockedUntil = new Date(now.getTime() + ttlMs);

      try {
        await prisma.jobLock.create({ data: { key, lockedUntil } });
        return { acquired: true, lockedUntil };
      } catch {
        const existing = await prisma.jobLock.findUnique({ where: { key } });
        if (!existing) return { acquired: false };

        if (existing.lockedUntil <= now) {
          await prisma.jobLock.update({ where: { key }, data: { lockedUntil } });
          return { acquired: true, lockedUntil };
        }

        return { acquired: false, lockedUntil: existing.lockedUntil };
      }
    },

    async renew(key: string, ttlMs: number) {
      const lockedUntil = new Date(Date.now() + ttlMs);
      await prisma.jobLock.updateMany({ where: { key }, data: { lockedUntil } });
      return lockedUntil;
    },

    async release(key: string) {
      await prisma.jobLock.deleteMany({ where: { key } });
    },

    /**
     * Helper: roda função somente se conseguir lock.
     * Retorna {acquired:false} em vez de lançar.
     */
    async runExclusive<T>(
      key: string,
      ttlMs: number,
      fn: (ctx: { renew: () => Promise<Date>; release: () => Promise<void> }) => Promise<T>
    ): Promise<{ acquired: true; result: T } | { acquired: false; lockedUntil?: Date }> {
      const lock = await this.acquire(key, ttlMs);
      if (!lock.acquired) return { acquired: false, lockedUntil: lock.lockedUntil };

      try {
        const result = await fn({
          renew: () => this.renew(key, ttlMs),
          release: () => this.release(key),
        });
        return { acquired: true, result };
      } finally {
        await this.release(key);
      }
    },
  };
}