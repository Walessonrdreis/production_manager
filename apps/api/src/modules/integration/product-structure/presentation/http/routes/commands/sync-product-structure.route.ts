import type { FastifyInstance } from "fastify";
import { env } from "@/config";

import { ProductStructureIntegrationStore } from "../../../../infrastructure/db/product-structure-integration.store";
import { SyncProductStructureUseCase } from "../../../../application/use-cases/sync-product-structure.usecase";

import { FakeProductStructureFetchGateway } from "../../../../infrastructure/gateways/fetch/fake-product-structure-fetch.gateway";
import { RealProductStructureFetchGateway } from "../../../../infrastructure/gateways/fetch/real-product-structure-fetch.gateway";

export function registerSyncProductStructureRoute(app: FastifyInstance) {
  app.post(
    "/v1/integration/product-structure/:productCode/sync",
    {
      schema: {
        tags: ["product-structure"],
        summary: "Sincronizar estrutura do produto (BOM) via Omie",
        description:
          "Comando de integração. Usa Fake/Real conforme env.PRODUCT_STRUCTURE_GATEWAY. Idempotente por externalRequestId.",
        params: {
          type: "object",
          required: ["productCode"],
          properties: {
            productCode: { type: "string" },
          },
        },
        body: {
          type: "object",
          required: ["externalRequestId"],
          properties: {
            externalRequestId: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      const { productCode } = request.params as any;
      const { externalRequestId } = (request.body as any) ?? {};

      if (!externalRequestId || String(externalRequestId).trim() === "") {
        return reply.status(400).send({
          success: false,
          error: "VALIDATION_ERROR",
          message: "externalRequestId is required",
        });
      }

      // Seleção Real/Fake centralizada
      const gateway =
        env.PRODUCT_STRUCTURE_GATEWAY === "fake"
          ? new FakeProductStructureFetchGateway()
          : new RealProductStructureFetchGateway((app as any).omieClient);

      const store = new ProductStructureIntegrationStore((app as any).prisma);
      const useCase = new SyncProductStructureUseCase(gateway, store);

      // Execução (efeito colateral: escreve no DB; Real chama Omie)
      await useCase.execute(String(productCode));

      // ACK do comando (padrão do projeto: comandos respondem ACCEPTED)
      return reply.status(202).send({
        success: true,
        data: {
          externalRequestId: String(externalRequestId),
          status: "ACCEPTED",
          productCode: String(productCode),
        },
      });
    }
  );
}
