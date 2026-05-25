import { AppError } from "@/shared/errors/AppError";

export function createSyncLockLeaseRepoPrisma(prisma: any) {
  // em alguns lugares seu código usa (prisma as any).syncLock
  const syncLock = (prisma as any).syncLock ?? prisma.syncLock;

  return {
    /**
     * Tenta adquirir lock por TTL.
     * - create (se não existir)
     * - se já existe: tenta updateMany quando lockedUntil <= now (lock expirado)
     * Retorna true se lock adquirido, false se lock ativo.
     */
    async acquire(key: string, ttlMs: number): Promise<boolean> {
      const now = new Date();
      const lockedUntil = new Date(now.getTime() + ttlMs);

      try {
        await syncLock.create({
          data: { key, lockedUntil },
        });
        return true;
      } catch (err: any) {
        // P2002: unique constraint (já existe)
        if (err?.code !== "P2002") {
          throw err;
        }

        const updated = await syncLock.updateMany({
          where: {
            key,
            lockedUntil: { lte: now },
          },
          data: { lockedUntil },
        });

        return (updated?.count ?? 0) > 0;
      }
    },

    /**
     * Libera o lock colocando lockedUntil = now (mesma semântica original).
     */
    async release(key: string): Promise<void> {
      const now = new Date();
      await syncLock.updateMany({
        where: { key },
        data: { lockedUntil: now },
      });
    },

    /**
     * Helper: se a tabela não existir/for inválida (caso raro), identifica.
     * Mantive por consistência com outros fluxos.
     */
    isTableUnavailableError(err: any): boolean {
      return err?.code === "P2021" || err?.code === "P2022";
    },
  };
}