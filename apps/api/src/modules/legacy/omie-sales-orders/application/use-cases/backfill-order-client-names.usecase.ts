import { prisma } from "@/infra/db";

export async function backfillOrderClientNames() {
  const orders = await prisma.omieOrder.findMany({
    where: {
      codigoCliente: { not: null },
      clientLegalName: null,
    },
    select: { id: true, codigoCliente: true },
  });

  let updated = 0;

  for (const order of orders) {
    const code = order.codigoCliente;
    if (!code) continue;

    const client = await prisma.client.findUnique({
      where: { omieClientCode: BigInt(code) },
      select: { legalName: true, tradeName: true },
    });

    if (!client) continue;

    await prisma.omieOrder.update({
      where: { id: order.id },
      data: {
        clientLegalName: client.legalName,
        clientTradeName: client.tradeName ?? null,
      },
    });

    updated++;
  }

  return { updated, scanned: orders.length };
}