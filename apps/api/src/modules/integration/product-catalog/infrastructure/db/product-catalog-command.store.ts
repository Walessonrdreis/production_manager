import { prisma } from "@/shared/db/prisma";
import { getLogger } from "@/shared/logger";

export type CreateAcceptedProductCatalogCommandInput = {
  externalRequestId: string;
  productCode: string;
  commandType: "SYNC";
  source?: "API2" | "JOB" | "ADMIN";
};

export class ProductCatalogCommandStore {
  private readonly logger = getLogger("ProductCatalogCommandStore");

  async findByExternalRequestId(externalRequestId: string) {
    return prisma.productCatalogCommand.findUnique({
      where: { externalRequestId },
    });
  }

  async getOrCreateAccepted(input: CreateAcceptedProductCatalogCommandInput) {
    const existing = await this.findByExternalRequestId(input.externalRequestId);
    if (existing) return { record: existing, created: false };

    this.logger.info("Criando comando ACEITO (product-catalog)", {
      externalRequestId: input.externalRequestId,
      productCode: input.productCode,
      commandType: input.commandType,
      source: input.source ?? "API2",
    });

    const record = await prisma.productCatalogCommand.create({
      data: {
        externalRequestId: input.externalRequestId,
        productCode: input.productCode,
        commandType: input.commandType,
        status: "ACCEPTED",
        source: input.source ?? "API2",
      },
    });

    return { record, created: true };
  }

  async markConfirmed(externalRequestId: string) {
    return prisma.productCatalogCommand.update({
      where: { externalRequestId },
      data: {
        status: "CONFIRMED",
        completedAt: new Date(),
      },
    });
  }

  async markFailed(externalRequestId: string, error: unknown) {
    return prisma.productCatalogCommand.update({
      where: { externalRequestId },
      data: {
        status: "FAILED",
        completedAt: new Date(),
        lastError:
          error instanceof Error
            ? { message: error.message, name: error.name }
            : { message: "Erro desconhecido" },
      },
    });
  }

  async listRecent(limit = 20) {
    return prisma.productCatalogCommand.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async listFailures(limit = 20) {
    return prisma.productCatalogCommand.findMany({
      where: { status: "FAILED" },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async getLatestGlobalSync() {
    return prisma.productCatalogCommand.findFirst({
      where: {
        productCode: "__GLOBAL__",
      },
      orderBy: { createdAt: "desc" },
    });
  }
}