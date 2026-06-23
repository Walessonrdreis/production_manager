import type { FastifyInstance } from "fastify";
import { env } from "@/config";

import { ProductStructureIntegrationStore } from "../../../../infrastructure/db/product-structure-integration.store";

import { RealProductStructureFetchGateway } from "../../../../infrastructure/gateways/fetch/real-product-structure-fetch.gateway";
import { FakeProductStructureFetchGateway } from "../../../../infrastructure/gateways/fetch/fake-product-structure-fetch.gateway";

import { ApplyProductStructureUseCase } from "../../../../application/use-cases/apply-product-structure.usecase";
import { FakeProductStructureApplyGateway } from "../../../../infrastructure/gateways/apply/fake-product-structure-apply.gateway";
import { RealProductStructureApplyGateway } from "../../../../infrastructure/gateways/apply/real-product-structure-apply.gateway";

export function registerApplyProductStructureRoute(app: FastifyInstance) {
  app.post(
    "/v1/integration/product-structure/commands/apply",
    {
      schema: {
        tags: ["product-structure"],
        summary: "Aplicar estrutura (BOM) no Omie",
        description:
          "Comando de integração: aplica estrutura no Omie (Incluir/Alterar) e sincroniza espelho. Real é idempotente.",
        body: {
          type: "object",
          required: ["externalRequestId", "productCode", "structure"],
          properties: {
            externalRequestId: { type: "string" },
            productCode: { type: "string" },
            structure: {
              type: "object",
              required: ["items"],
              properties: {
                items: {
                  type: "array",
                  items: {
                    type: "object",
                    required: ["componentCode", "quantity"],
                    properties: {
                      componentCode: { type: "string" },
                      quantity: { type: ["string", "number"] },
                      unit: { type: "string" },
                      loss: { type: ["string", "number"] },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const body = (request.body as any) ?? {};
      const productCode = String(body.productCode ?? "").trim();
      const externalRequestId = String(body.externalRequestId ?? "").trim();
      const items = body?.structure?.items ?? [];

      if (!externalRequestId) {
        return reply.status(400).send({
          success: false,
          error: "VALIDATION_ERROR",
          message: "externalRequestId is required",
        });
      }

      if (!Array.isArray(items) || items.length === 0) {
        return reply.status(400).send({
          success: false,
          error: "VALIDATION_ERROR",
          message: "structure.items must be a non-empty array",
        });
      }

      const isFake = env.PRODUCT_STRUCTURE_GATEWAY === "fake";

      const applyGateway = isFake
        ? new FakeProductStructureApplyGateway()
        : new RealProductStructureApplyGateway((app as any).omieClient);

      const fetchGateway = isFake
        ? new FakeProductStructureFetchGateway()
        : new RealProductStructureFetchGateway((app as any).omieClient);

      const integrationStore = new ProductStructureIntegrationStore((app as any).prisma);

      const useCase = new ApplyProductStructureUseCase(
        applyGateway,
        fetchGateway,
        integrationStore,
        { noWrite: isFake }
      );

      const result = await useCase.execute({
        externalRequestId,
        productCode: String(productCode),
        items,
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