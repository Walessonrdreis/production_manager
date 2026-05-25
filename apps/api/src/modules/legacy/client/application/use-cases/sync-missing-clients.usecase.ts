import { prisma } from "@/infra/db";
import type { OmieClientGateway } from "../../application/ports/omie-client-gateway.port";
import type { ClientPrismaRepository } from "../../infrastructure/db/client.repo.prisma";

function toBigIntSafe(value?: string | null): bigint | null {
  if (!value) return null;
  try {
    const s = String(value).trim();
    if (!s) return null;
    return BigInt(s);
  } catch {
    return null;
  }
}

export function createSyncMissingClientsUseCase(deps: {
  clientRepository: ClientPrismaRepository;
  omieClientGateway: OmieClientGateway;
}) {
  return {
    async execute() {
      const rows = await prisma.omieOrder.findMany({
        where: {
          codigoCliente: { not: null },
          clientLegalName: null,
        },
        select: { codigoCliente: true },
        distinct: ["codigoCliente"],
      });

      let checked = 0;
      let synced = 0;

      for (const r of rows) {
        const code = toBigIntSafe(r.codigoCliente);
        if (!code) continue;

        checked++;

        const exists = await prisma.client.findUnique({
          where: { omieClientCode: code },
          select: { omieClientCode: true },
        });
        if (exists) continue;

        const raw = await deps.omieClientGateway.getClientByCode(code);
        if (!raw) continue;

        // Ajuste aqui conforme seu repository salva o client
        await deps.clientRepository.upsertFromOmieRaw(raw);

        synced++;
      }

      return { ok: true, checked, synced };
    },
  };
}