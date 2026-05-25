import type { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "@/infra/db";

/**
 * Backfill: preenche clientLegalName/clientTradeName nas orders existentes
 * usando a tabela clientes (omieClientCode).
 *
 * Endpoint técnico (manual) — ideal para rodar via curl.
 */
export async function backfillOrderClientNamesController(
  _request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const orders = await prisma.omieOrder.findMany({
      where: {
        codigoCliente: { not: null },
        clientLegalName: null,
      },
      select: { id: true, codigoCliente: true },
    });

    let updated = 0;

    for (const order of orders) {
      const code = order.codigoCliente?.trim();
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

    return reply.code(200).send({
      success: true,
      data: { updated, scanned: orders.length },
    });
  } catch (err: any) {
    return reply.code(500).send({
      success: false,
      error: "INTERNAL_ERROR",
      message: err?.message || "Failed to backfill order client names",
    });
  }
}