import { AppError } from "@/shared/errors/AppError";

const SYNC_LOCK_KEY = "omie_products_sync";

export function createSyncLockRepoPrisma(prisma: any) {
  function isSyncLockTableUnavailable(error: any): boolean {
    return error?.code === "P2021" || error?.code === "P2022";
  }

  return {
    key: SYNC_LOCK_KEY,

    isTableUnavailableError: isSyncLockTableUnavailable,

    async ensureRowExists() {
      let lock = await prisma.syncLock.findUnique({ where: { key: SYNC_LOCK_KEY } });

      if (!lock) {
        try {
          lock = await prisma.syncLock.create({
            data: { key: SYNC_LOCK_KEY, lockedUntil: new Date(0) },
          });
        } catch (e: any) {
          // alguém criou ao mesmo tempo
          if (e?.code === "P2002") {
            lock = await prisma.syncLock.findUnique({ where: { key: SYNC_LOCK_KEY } });
          } else {
            throw e;
          }
        }
      }

      return lock;
    },

    async tryAcquire(nowMs: number, ttlMs: number) {
      const lock = await this.ensureRowExists();

      if (lock.lockedUntil.getTime() > nowMs) {
        throw new AppError("SYNC_IN_PROGRESS", 409, "Sincronização já em andamento");
      }

      // compare-and-set: trava somente se ninguém alterou lockedUntil entre leitura e update
      const updated = await prisma.syncLock.updateMany({
        where: { key: SYNC_LOCK_KEY, lockedUntil: lock.lockedUntil },
        data: { lockedUntil: new Date(nowMs + ttlMs) },
      });

      if (updated.count === 0) {
        throw new AppError("SYNC_IN_PROGRESS", 409, "Sincronização já em andamento");
      }

      return true;
    },

    async release() {
      await prisma.syncLock.update({
        where: { key: SYNC_LOCK_KEY },
        data: { lockedUntil: new Date(0) },
      });
    },
  };
}