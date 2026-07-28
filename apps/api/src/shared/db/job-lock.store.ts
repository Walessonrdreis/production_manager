import { prisma } from "@/shared/db/prisma";

export class JobLockStore {
  async acquireLock(key: string, ttlSeconds: number) {
    const now = new Date();
    const lockedUntil = new Date(now.getTime() + ttlSeconds * 1000);

    try {
      const existing = await prisma.jobLock.findUnique({
        where: { key },
      });

      if (existing && existing.lockedUntil > now) {
        return false;
      }

      await prisma.jobLock.upsert({
        where: { key },
        update: {
          lockedUntil,
          updatedAt: new Date(),
        },
        create: {
          key,
          lockedUntil,
        },
      });

      return true;
    } catch (error) {
      return false;
    }
  }

  async releaseLock(key: string) {
    await prisma.jobLock.update({
      where: { key },
      data: {
        lockedUntil: new Date(0),
      },
    });
  }
}