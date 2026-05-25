import { PrismaClient } from '@prisma/client';
import { ClientPrismaRepository } from '../client.repo.prisma';

async function run() {
  const prisma = new PrismaClient();
  const repo = new ClientPrismaRepository(prisma);

  await repo.upsert({
    omieClientCode: 1n,
    legalName: 'Test Client',
    tradeName: 'Test',
    document: '000',
    personType: 'COMPANY',
    email: 'test@test.com',
    phone: '61999999999',
    isActive: true,
    isBlocked: false,
    isBillingBlocked: false,
  });

  const client = await repo.findByOmieClientCode(1n);
  console.log(client);

  await prisma.$disconnect();
}

run();
