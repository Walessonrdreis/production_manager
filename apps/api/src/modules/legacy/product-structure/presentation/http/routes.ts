import type { FastifyInstance } from "fastify";
import { syncProductStructureController } from "./controllers/sync-product-structure.controller";
import { getProductStructureController } from "./controllers/get-product-structure.controller";
import { syncProductStructureJobTickController } from "./controllers/sync-product-structure-job-tick.controller";
import { listProductStructuresController } from "./controllers/list-product-structures.controller";

import {
  SyncProductStructureBodySchema,
  SyncProductStructureResponseSchema,
  GetProductStructureParamsSchema,
  ProductStructureOutputSchema,
} from "./schemas";

export async function productStructureRoutes(app: FastifyInstance) {
  /**
   * Padrão do projeto:
   * - Admin + Omie => /v1/admin/omie/...
   * - Admin local => /v1/admin/...
   */

  // GET /v1/admin/product-structures
  app.route({
    method: "GET",
    url: "/v1/admin/product-structures",
    schema: {
      tags: ["admin", "product-structures"],
      description:
        "[Admin] Lista as estruturas de produtos persistidas com paginação e filtros.",
    },
    handler: listProductStructuresController,
  });

  // POST /v1/admin/omie/product-structures/sync
  app.route({
    method: "POST",
    url: "/v1/admin/omie/product-structures/sync",
    schema: {
      tags: ["admin", "omie", "product-structures"],
      description:
        "[Admin][Omie] Sincroniza a estrutura (malha) de um produto. Aceita codProduto, idProduto ou intProduto.",
      body: SyncProductStructureBodySchema,
      response: {
        200: SyncProductStructureResponseSchema,
      },
    },
    handler: syncProductStructureController,
  });

  // GET /v1/admin/product-structures/:codProduto
  app.route({
    method: "GET",
    url: "/v1/admin/product-structures/:codProduto",
    schema: {
      tags: ["admin", "product-structures"],
      description:
        "[Admin] Obtém a estrutura (malha) persistida pelo codProduto (domínio estável).",
      params: GetProductStructureParamsSchema,
      response: {
        200: ProductStructureOutputSchema,
      },

    },
    handler: getProductStructureController,
  });

  // ✅ ROTA REAL DO JOB TICK
 app.route({
  method: "POST",
  url: "/v1/admin/omie/product-structures/sync-job-tick",
  schema: {
    description:
      "[Admin][Omie][Job] Executa 1 tick de sincronização por página (interno).",
  },
  handler: syncProductStructureJobTickController,
});
}

