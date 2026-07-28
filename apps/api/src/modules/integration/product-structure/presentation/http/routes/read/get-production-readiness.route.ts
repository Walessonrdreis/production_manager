import type { FastifyInstance } from "fastify";
import { GetProductsProductionReadModelUseCase } from "../../../../application/use-cases/get-products-production-read-model.usecase";

function toBool(v: any, defaultValue = false) {
  if (v === undefined || v === null) return defaultValue;
  if (typeof v === "boolean") return v;
  const s = String(v).toLowerCase().trim();
  return s === "true" || s === "1" || s === "yes" || s === "y";
}

function toNum(v: any, defaultValue: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : defaultValue;
}

export function registerGetProductionReadinessRoute(app: FastifyInstance) {
  const readModelUseCase = new GetProductsProductionReadModelUseCase();

  app.get(
    "/v1/admin/read/products/production-readiness",
    {
      schema: {
        tags: ["product-structure"],
        summary: "Readiness de produtos para produção",
        description:
          "Read-model que indica se um produto está apto a gerar Ordem de Produção. Suporta summary e data via view.",
        querystring: {
          type: "object",
          properties: {
            view: { type: "string", enum: ["summary", "data"] },
            q: { type: "string" },
            activeOnly: { type: "boolean" },
            onlyWithoutStructure: { type: "boolean" },
            structureStatus: { type: "string", enum: ["with", "without"] },
            limit: { type: "number" },
            offset: { type: "number" },
            sort: { type: "string", enum: ["description", "productCode", "hasStructure"] },
            order: { type: "string", enum: ["asc", "desc"] },
            since: { type: "string" },
            includeItems: { type: "boolean" },
          },
        },
      },
    },
    async (request, reply) => {
      const q = (request.query as any)?.q ?? null;

      const params = {
        view: (request.query as any)?.view,
        q: q ? String(q) : null,
        activeOnly: toBool((request.query as any)?.activeOnly, true),
        onlyWithoutStructure: toBool((request.query as any)?.onlyWithoutStructure, false),
        structureStatus: (request.query as any)?.structureStatus,
        limit: toNum((request.query as any)?.limit, 50),
        offset: toNum((request.query as any)?.offset, 0),
        sort: (request.query as any)?.sort ?? "description",
        order: (request.query as any)?.order ?? "asc",
        since: (request.query as any)?.since ? String((request.query as any)?.since) : null,
        includeItems: toBool((request.query as any)?.includeItems, false),
      };

      const result = await readModelUseCase.execute(params);
      return reply.send({ success: true, ...result });
    }
  );
}