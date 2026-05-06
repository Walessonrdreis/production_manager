// File: apps/api/src/modules/orders-enriched/infrastructure/db/client-lookup.prisma.ts

import { PrismaClient } from "@prisma/client";
import { ClientLookup, ClientSnapshot } from "../../application/ports/client-lookup.port";

export class ClientLookupPrisma implements ClientLookup {
  constructor(private readonly prisma: PrismaClient) {}

  async findManyByOmieClientCodes(codes: bigint[]): Promise<ClientSnapshot[]> {
    const rows = await this.prisma.client.findMany({
      where: { omieClientCode: { in: codes } },
      select: {
        omieClientCode: true,
        legalName: true,
        tradeName: true,
        document: true,
      },
    });

    return rows.map((r) => ({
      omieClientCode: r.omieClientCode,
      legalName: r.legalName,
      tradeName: r.tradeName ?? null,
      document: r.document,
    }));
  }
}