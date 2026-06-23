import type { FastifyInstance } from "fastify";
import { env } from "@/config";

import { ProductStructureIntegrationStore } from "../../../../infrastructure/db/product-structure-integration.store";

import { SyncProductStructureUseCase } from "../../../../application/use-cases/sync-product-structure.usecase";

import { FakeProductStructureFetchGateway } from "../../../../infrastructure/gateways/fetch/fake-product-structure-fetch.gateway";
import { RealProductStructureFetchGateway } from "../../../../infrastructure/gateways/fetch/real-product-structure-fetch.gateway";

export function registerSyncProductStructureRoute(app: FastifyInstance) {
  app.post(
    "/v1/integration/product-structure/commands/sync",
    {
      schema: {
        tags: ["product-structure"],
        summary: "Sincronizar estrutura do produto (BOM) via Omie",
        description:
          "Comando de integração. Fake no-write. Real é idempotente por externalRequestId.",
        body: {
          type: "object",
          required: ["externalRequestId", "productCode"],
          properties: {
            externalRequestId: { type: "string" },
            productCode: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      const { productCode, externalRequestId } = (request.body as any) ?? {};

      const ext = String(externalRequestId ?? "").trim();
      if (!ext) {
        return reply.status(400).send({
          success: false,
          error: "VALIDATION_ERROR",
          message: "externalRequestId is required",
        });
      }

      const isFake = env.PRODUCT_STRUCTURE_GATEWAY === "fake";

      const fetchGateway = isFake
        ? new FakeProductStructureFetchGateway()
        : new RealProductStructureFetchGateway((app as any).omieClient);

      const integrationStore = new ProductStructureIntegrationStore((app as any).prisma);

      const useCase = new SyncProductStructureUseCase(
        fetchGateway,
        integrationStore,
        { noWrite: isFake }
      );

      const result = await useCase.execute({
        externalRequestId: ext,
        productCode: String(productCode),
      });

      // Padrão: sempre ACK 202
      return reply.status(202).send({
        success: true,
        data: {
          externalRequestId: ext,
          status: result.status,
          productCode: String(productCode),
        },
      });
    }
  );
}