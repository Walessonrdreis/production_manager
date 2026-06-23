// ---------------------------------------------------------------------------
// Command Store — Product Structure
// ---------------------------------------------------------------------------
// Suporta Command Queue Pattern: PENDING → PROCESSING → CONFIRMED / FAILED
// Responsável exclusivamente por:
// - idempotência por externalRequestId
// - enfileiramento e dequeuing atômico (SKIP LOCKED)
// - tracking de status (PENDING | PROCESSING | ACCEPTED | CONFIRMED | FAILED)
// - auditoria mínima de comandos
// ---------------------------------------------------------------------------

import type { PrismaClient, ProductStructureCommand } from "@prisma/client";
import { Prisma } from "@prisma/client";

export type ProductStructureCommandTypeEnum = "SYNC" | "SYNC_GLOBAL" | "APPLY" | "DELETE";
export type ProductStructureCommandStatusEnum = "PENDING" | "PROCESSING" | "ACCEPTED" | "CONFIRMED" | "FAILED";
export type ProductStructureCommandSourceEnum = "API2" | "JOB" | "ADMIN";

export type EnqueueCommandInput = {
  externalRequestId: string;
  productCode: string;
  commandType: ProductStructureCommandTypeEnum;
  payload?: Record<string, unknown>;
  source?: ProductStructureCommandSourceEnum;
};

export type CreateAcceptedCommandInput = {
  externalRequestId: string;
  productCode: string;
  commandType: ProductStructureCommandTypeEnum;
  source?: ProductStructureCommandSourceEnum;
};

export type StatusCounts = {
  pending: number;
  processing: number;
  accepted: number;
  confirmed: number;
  failed: number;
};

export class ProductStructureCommandStore {
  constructor(private readonly prisma: PrismaClient) { }

  // ─── Busca ───────────────────────────────────────────────────────────

  async findByExternalRequestId(
    externalRequestId: string
  ): Promise<ProductStructureCommand | null> {
    return this.prisma.productStructureCommand.findUnique({
      where: { externalRequestId },
    });
  }

  // ─── Enfileiramento (PENDING) ────────────────────────────────────────

  /**
   * Cria um comando com status PENDING para processamento assíncrono.
   * Se já existir com o mesmo externalRequestId, retorna o existente.
   */
  async enqueue(
    input: EnqueueCommandInput
  ): Promise<{ record: ProductStructureCommand; created: boolean }> {
    const existing = await this.findByExternalRequestId(input.externalRequestId);
    if (existing) {
      return { record: existing, created: false };
    }

    const record = await this.prisma.productStructureCommand.create({
      data: {
        externalRequestId: input.externalRequestId,
        productCode: input.productCode,
        commandType: input.commandType as any,
        status: "PENDING",
        source: input.source ?? "API2",
        payload: input.payload
          ? (input.payload as Prisma.InputJsonValue)
          : Prisma.DbNull,
      },
    });

    return { record, created: true };
  }

  /**
   * Mantido para compatibilidade com fluxo síncrono.
   * Cria com status ACCEPTED (sem fila).
   */
  async getOrCreateAccepted(
    input: CreateAcceptedCommandInput
  ): Promise<{ record: ProductStructureCommand; created: boolean }> {
    const existing = await this.findByExternalRequestId(input.externalRequestId);
    if (existing) {
      return { record: existing, created: false };
    }

    const record = await this.prisma.productStructureCommand.create({
      data: {
        externalRequestId: input.externalRequestId,
        productCode: input.productCode,
        commandType: input.commandType as any,
        status: "ACCEPTED",
        source: input.source ?? "API2",
        executedAt: new Date(),
      },
    });

    return { record, created: true };
  }

  // ─── Dequeuing (PENDING → PROCESSING) ────────────────────────────────

  /**
   * Dequeue atômico: pega N comandos PENDING e marca como PROCESSING.
   * Usa SELECT ... FOR UPDATE SKIP LOCKED para evitar concorrência
   * entre múltiplos workers/instâncias.
   */
  async dequeue(batchSize = 1): Promise<ProductStructureCommand[]> {
    const rows: Array<{ id: string }> = await this.prisma.$queryRawUnsafe(
      `SELECT id FROM integration.product_structure_command
       WHERE status = 'PENDING'
       ORDER BY created_at ASC
       LIMIT $1
       FOR UPDATE SKIP LOCKED`,
      batchSize
    );

    if (rows.length === 0) return [];

    const ids = rows.map((r) => r.id);

    await this.prisma.productStructureCommand.updateMany({
      where: { id: { in: ids } },
      data: {
        status: "PROCESSING",
        executedAt: new Date(),
      },
    });

    return this.prisma.productStructureCommand.findMany({
      where: { id: { in: ids } },
      orderBy: { createdAt: "asc" },
    });
  }

  // ─── Transições de Status ────────────────────────────────────────────

  async markProcessing(
    externalRequestId: string
  ): Promise<ProductStructureCommand> {
    return this.prisma.productStructureCommand.update({
      where: { externalRequestId },
      data: {
        status: "PROCESSING",
        executedAt: new Date(),
      },
    });
  }

  async markConfirmed(
    externalRequestId: string
  ): Promise<ProductStructureCommand | null> {
    const found = await this.prisma.productStructureCommand.findUnique({
      where: { externalRequestId },
    });
    if (!found) return null;

    return this.prisma.productStructureCommand.update({
      where: { externalRequestId },
      data: {
        status: "CONFIRMED",
        completedAt: new Date(),
        lastError: Prisma.DbNull,
      },
    });
  }

  async markFailed(
    externalRequestId: string,
    error: unknown
  ): Promise<ProductStructureCommand | null> {
    const found = await this.prisma.productStructureCommand.findUnique({
      where: { externalRequestId },
    });
    if (!found) return null;

    const normalized =
      error instanceof Error
        ? {
          message: error.message,
          name: error.name,
          stack: error.stack,
        }
        : { message: String(error) };

    return this.prisma.productStructureCommand.update({
      where: { externalRequestId },
      data: {
        status: "FAILED",
        completedAt: new Date(),
        lastError: normalized as Prisma.InputJsonValue,
      },
    });
  }

  // ─── Consultas Agregadas ─────────────────────────────────────────────

  async countByStatus(
    status: ProductStructureCommandStatusEnum
  ): Promise<number> {
    return this.prisma.productStructureCommand.count({
      where: { status },
    });
  }

  /**
   * Retorna contagem de todos os status em uma única chamada.
   */
  async countByStatusAll(): Promise<StatusCounts> {
    const rows = await this.prisma.$queryRawUnsafe<
      Array<{ status: string; count: bigint }>
    >(
      `SELECT status, COUNT(*)::int8 as count
       FROM integration.product_structure_command
       GROUP BY status`
    );

    const result: StatusCounts = {
      pending: 0,
      processing: 0,
      accepted: 0,
      confirmed: 0,
      failed: 0,
    };

    for (const row of rows) {
      const key = row.status.toLowerCase() as keyof StatusCounts;
      if (key in result) {
        result[key] = Number(row.count);
      }
    }

    return result;
  }

  /**
   * Lista os comandos mais recentes (qualquer status).
   */
  async listRecent(limit = 20): Promise<ProductStructureCommand[]> {
    return this.prisma.productStructureCommand.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  /**
   * Lista os comandos com falha mais recentes.
   */
  async listFailures(limit = 20): Promise<ProductStructureCommand[]> {
    return this.prisma.productStructureCommand.findMany({
      where: { status: "FAILED" },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  /**
   * Busca comandos PROCESSING mais antigos que N ms (stalled/orphaned).
   * Útil para recuperação de comandos que travaram.
   */
  async findProcessingStalled(
    ageMs: number
  ): Promise<ProductStructureCommand[]> {
    const cutoff = new Date(Date.now() - ageMs);
    return this.prisma.productStructureCommand.findMany({
      where: {
        status: "PROCESSING",
        executedAt: { lt: cutoff },
      },
      orderBy: { executedAt: "asc" },
    });
  }

  /**
   * Último comando de um produto (qualquer status).
   */
  async lastForProduct(
    productCode: string
  ): Promise<ProductStructureCommand | null> {
    return this.prisma.productStructureCommand.findFirst({
      where: { productCode },
      orderBy: { createdAt: "desc" },
    });
  }
}
