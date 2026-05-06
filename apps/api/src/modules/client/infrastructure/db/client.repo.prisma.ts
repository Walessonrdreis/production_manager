import { PrismaClient, Prisma } from '@prisma/client';
import { ClientRepository } from '../../application/ports/client-repository.port';
import { Client } from '../../application/dtos/client.dto';

export class ClientPrismaRepository implements ClientRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async upsert(client: Client): Promise<void> {
    await this.prisma.client.upsert({
      where: {
        omieClientCode: client.omieClientCode,
      },
      create: {
        omieClientCode: client.omieClientCode,
        legalName: client.legalName,
        tradeName: client.tradeName,
        document: client.document,
        personType: client.personType,
        email: client.email,
        phone: client.phone,
        isActive: client.isActive,
        isBlocked: client.isBlocked,
        isBillingBlocked: client.isBillingBlocked,
        createdAtOmie: client.createdAtOmie,
        updatedAtOmie: client.updatedAtOmie,
      },
      update: {
        legalName: client.legalName,
        tradeName: client.tradeName,
        document: client.document,
        personType: client.personType,
        email: client.email,
        phone: client.phone,
        isActive: client.isActive,
        isBlocked: client.isBlocked,
        isBillingBlocked: client.isBillingBlocked,
        updatedAtOmie: client.updatedAtOmie,
      },
    });
  }

  async findByOmieClientCode(
    omieClientCode: bigint
  ): Promise<Client | null> {
    const record = await this.prisma.client.findUnique({
      where: { omieClientCode },
    });

    if (!record) return null;

    return {
      omieClientCode: record.omieClientCode,
      legalName: record.legalName,
      tradeName: record.tradeName,
      document: record.document,
      personType: record.personType,
      email: record.email,
      phone: record.phone,
      isActive: record.isActive,
      isBlocked: record.isBlocked,
      isBillingBlocked: record.isBillingBlocked,
      createdAtOmie: record.createdAtOmie,
      updatedAtOmie: record.updatedAtOmie,
    };
  }
  async list(params: {
  page: number;
  pageSize: number;
  q?: string;
}): Promise<{ data: Client[]; total: number }> {
  const { page, pageSize, q } = params;

  const where: Prisma.ClientWhereInput | undefined = q
  ? {
      OR: [
        {
          legalName: {
            contains: q,
            mode: Prisma.QueryMode.insensitive,
          },
        },
        {
          tradeName: {
            contains: q,
            mode: Prisma.QueryMode.insensitive,
          },
        },
        {
          document: {
            contains: q,
          },
        },
      ],
    }
  : undefined;

  const [data, total] = await this.prisma.$transaction([
    this.prisma.client.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { legalName: "asc" },
    }),
    this.prisma.client.count({ where }),
  ]);

  return {
    total,
    data: data.map((record) => ({
      omieClientCode: record.omieClientCode,
      legalName: record.legalName,
      tradeName: record.tradeName,
      document: record.document,
      personType: record.personType,
      email: record.email,
      phone: record.phone,
      isActive: record.isActive,
      isBlocked: record.isBlocked,
      isBillingBlocked: record.isBillingBlocked,
      createdAtOmie: record.createdAtOmie,
      updatedAtOmie: record.updatedAtOmie,
    })),
  };
}
}
