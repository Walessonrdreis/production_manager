import { prisma } from '../db';

export async function acquireJobLock(key: string, ttlMs: number): Promise<boolean> {
  const now = new Date();
  const lockedUntil = new Date(now.getTime() + ttlMs);

  try {
    return await prisma.$transaction(async (tx: any) => {
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
  } catch (err: any) {
    // Corrida de criação/atualização em execuções concorrentes:
    // não adquirir lock não é erro de fluxo, deve retornar false.
    if (err?.code === 'P2002' || err?.code === 'P2025') {
      return false;
    }

    throw err;
  }
}

export async function releaseJobLock(key: string): Promise<void> {
  const now = new Date();

  await prisma.$transaction(async (tx: any) => {
    await tx.jobLock.updateMany({
      where: { key },
      data: { lockedUntil: now },
    });
  });
}

