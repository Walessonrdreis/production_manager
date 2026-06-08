import type { PrismaClient, ProductStructureCommand } from "@prisma/client";
import { Prisma } from "@prisma/client";

export type CreateAcceptedCommandInput = {
  externalRequestId: string;
  productCode: string;
  commandType: "SYNC" | "APPLY" | "DELETE";
  source?: "API2" | "JOB" | "ADMIN";
};

/**
 * Store responsável EXCLUSIVAMENTE por:
 * - idempotência por externalRequestId
 * - tracking de status (ACCEPTED | CONFIRMED | FAILED)
 * - auditoria mínima de comandos
 */
export class ProductStructureCommandStore {
  constructor(private readonly prisma: PrismaClient) {}

  async findByExternalRequestId(
    externalRequestId: string
  ): Promise<ProductStructureCommand | null> {
    return this.prisma.productStructureCommand.findUnique({
      where: { externalRequestId },
    });
  }

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
        commandType: input.commandType,
        status: "ACCEPTED",
        source: input.source ?? "API2",
        executedAt: new Date(),
      },
    });

    return { record, created: true };
  }

  async markConfirmed(
    externalRequestId: string
  ): Promise<ProductStructureCommand> {
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
  ): Promise<ProductStructureCommand> {
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

  async countByStatus(
    status: "ACCEPTED" | "CONFIRMED" | "FAILED"
  ): Promise<number> {
    return this.prisma.productStructureCommand.count({
      where: { status },
    });
  }

  async lastForProduct(
    productCode: string
  ): Promise<ProductStructureCommand | null> {
    return this.prisma.productStructureCommand.findFirst({
      where: { productCode },
      orderBy: { createdAt: "desc" },
    });
  }
}
