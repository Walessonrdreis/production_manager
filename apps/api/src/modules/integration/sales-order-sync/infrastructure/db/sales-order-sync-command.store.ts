import type { PrismaClient, SalesOrderSyncCommand } from "@prisma/client";
import { Prisma } from "@prisma/client";

export type CreateAcceptedCommandInput = {
  externalRequestId: string;
  resourceId: string;
  commandType: "SYNC" | "APPLY" | "DELETE";
  source?: "API2" | "JOB" | "ADMIN";
};

/**
 * Store responsável por:
 * - idempotência
 * - tracking de status
 * - auditoria mínima de comandos
 */
export class SalesOrderSyncCommandStore {
  constructor(private readonly prisma: PrismaClient) { }

  async findByExternalRequestId(
    externalRequestId: string
  ): Promise<SalesOrderSyncCommand | null> {
    return this.prisma.salesOrderSyncCommand.findUnique({
      where: { externalRequestId },
    });
  }

  async getOrCreateAccepted(
    input: CreateAcceptedCommandInput
  ): Promise<{ record: SalesOrderSyncCommand; created: boolean }> {
    const existing = await this.findByExternalRequestId(
      input.externalRequestId
    );

    if (existing) {
      return { record: existing, created: false };
    }

    const record = await this.prisma.salesOrderSyncCommand.create({
      data: {
        externalRequestId: input.externalRequestId,
        resourceId: input.resourceId,
        commandType: input.commandType,
        status: "ACCEPTED",
        source: input.source ?? "API2",
      },
    });

    return { record, created: true };
  }

  async markConfirmed(
    externalRequestId: string
  ): Promise<SalesOrderSyncCommand> {
    return this.prisma.salesOrderSyncCommand.update({
      where: { externalRequestId },
      data: {
        status: "CONFIRMED",
        completedAt: new Date(),
        lastError: Prisma.DbNull, // ✅ CORRETO
      },
    });
  }

  async markFailed(
    externalRequestId: string,
    error: unknown
  ): Promise<SalesOrderSyncCommand> {
    const normalized =
      error instanceof Error
        ? {
          message: error.message,
          name: error.name,
          stack: error.stack,
        }
        : { message: String(error) };

    return this.prisma.salesOrderSyncCommand.update({
      where: { externalRequestId },
      data: {
        status: "FAILED",
        completedAt: new Date(),
        lastError: normalized as Prisma.InputJsonValue,
      },
    });
  }

  async countByStatus(
    status: "ACCEPTED" | "CONFIRMED" | "FAILED"
  ): Promise<number> {
    return this.prisma.salesOrderSyncCommand.count({
      where: { status },
    });
  }

  async listByStatus(
    status: "ACCEPTED" | "CONFIRMED" | "FAILED",
    options?: { limit?: number; offset?: number }
  ): Promise<SalesOrderSyncCommand[]> {
    return this.prisma.salesOrderSyncCommand.findMany({
      where: { status },
      orderBy: { createdAt: "desc" },
      take: options?.limit ?? 50,
      skip: options?.offset ?? 0,
    });
  }
}