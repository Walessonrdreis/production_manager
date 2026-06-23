import type { FastifyInstance } from "fastify";
import { env } from "@/config";

import { ProductStructureIntegrationStore } from "../../../../infrastructure/db/product-structure-integration.store";

import { RealProductStructureFetchGateway } from "../../../../infrastructure/gateways/fetch/real-product-structure-fetch.gateway";
import { FakeProductStructureFetchGateway } from "../../../../infrastructure/gateways/fetch/fake-product-structure-fetch.gateway";

import { DeleteProductStructureUseCase } from "../../../../application/use-cases/delete-product-structure.usecase";
import { FakeProductStructureDeleteGateway } from "../../../../infrastructure/gateways/delete/fake-product-structure-delete.gateway";
import { RealProductStructureDeleteGateway } from "../../../../infrastructure/gateways/delete/real-product-structure-delete.gateway";

export function registerDeleteProductStructureRoute(app: FastifyInstance) {
  app.post(
    "/v1/integration/product-structure/commands/delete",
    {
      schema: {
        tags: ["product-structure"],
        summary: "Excluir estrutura (BOM) no Omie",
        description:
          "Comando de integração: exclui estrutura no Omie e sincroniza espelho. Real é idempotente.",
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
      const body = (request.body as any) ?? {};
      const productCode = String(body.productCode ?? "").trim();
      const externalRequestId = String(body.externalRequestId ?? "").trim();

      if (!externalRequestId) {
        return reply.status(400).send({
          success: false,
          error: "VALIDATION_ERROR",
          message: "externalRequestId is required",
        });
      }

      const isFake = env.PRODUCT_STRUCTURE_GATEWAY === "fake";

      const deleteGateway = isFake
        ? new FakeProductStructureDeleteGateway()
        : new RealProductStructureDeleteGateway((app as any).omieClient);

      const fetchGateway = isFake
        ? new FakeProductStructureFetchGateway()
        : new RealProductStructureFetchGateway((app as any).omieClient);

      const integrationStore = new ProductStructureIntegrationStore((app as any).prisma);

      const useCase = new DeleteProductStructureUseCase(
        deleteGateway,
        fetchGateway,
        integrationStore,
        { noWrite: isFake }
      );

      const result = await useCase.execute({
        externalRequestId,
        productCode: String(productCode),
      });

      return reply.status(202).send({
        success: true,
        data: {
          externalRequestId,
          status: result.status,
          productCode: String(productCode),
        },
      });
    }
  );
}