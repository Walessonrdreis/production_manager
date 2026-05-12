import type { FastifyInstance } from "fastify";
import { productStructureRoutes } from "./presentation/http/routes";
import { ProductStructurePrismaRepository } from "./infrastructure/db/prisma/product-structure.prisma-repository";
import { OmieProductStructureGatewayImpl } from "./infrastructure/integrations/omie/omie-product-structure.gateway";
import { SyncOmieProductStructureUseCase } from "./application/use-cases/sync-omie-product-structure.usecase";
import { GetProductStructureByCodProdutoUseCase } from "./application/use-cases/get-product-structure-by-codproduto.usecase";
import { mapOmieToUpsertInput } from "./application/utils/omie-mappers";
import { computeStructureHash } from "./application/utils/compute-structure-hash";

declare module "fastify" {
  interface FastifyInstance {
    productStructure: {
      syncUseCase: SyncOmieProductStructureUseCase;
      getByCodProdutoUseCase: GetProductStructureByCodProdutoUseCase;
    };

    productStructureInFlight: Map<string, Promise<any>>;
    omieMalhaRateLimit: { blockedUntil: number };

    productStructureSyncJobState: {
      page: number;
      blockedUntil: number;
      pageSize: number;
      maxPages: number;
    };

    // ✅ decoradores explícitos para o job tick (sem acesso direto a infra fora do index)
    productStructureGateway: OmieProductStructureGatewayImpl;
    productStructureRepository: ProductStructurePrismaRepository;
    productStructureMapOmieToUpsert: (estrutura: any) => any;
    productStructureComputeHash: (upsertBase: any) => string;
  }
}

export default async function registerProductStructureModule(app: FastifyInstance) {
  const repository = new ProductStructurePrismaRepository(app.prisma);
  const gateway = new OmieProductStructureGatewayImpl(app.omieClient);

  const syncUseCase = new SyncOmieProductStructureUseCase({ gateway, repository });
  const getByCodProdutoUseCase = new GetProductStructureByCodProdutoUseCase({ repository });

  app.decorate("productStructure", { syncUseCase, getByCodProdutoUseCase });

  app.decorate("productStructureInFlight", new Map<string, Promise<any>>());
  app.decorate("omieMalhaRateLimit", { blockedUntil: 0 });

  app.decorate("productStructureSyncJobState", {
    page: 1,
    blockedUntil: 0,
    pageSize: 100,
    maxPages: 50,
  });

  // ✅ expõe infra pro "job tick" de forma explícita (ainda dentro do módulo)
  app.decorate("productStructureGateway", gateway);
  app.decorate("productStructureRepository", repository);
  app.decorate("productStructureMapOmieToUpsert", (estrutura: any) => {
    // adapta o formato OmieEstrutura ({ ident, itens }) para o formato esperado pelo mapper
    const omieResult = {
      parent: estrutura.ident,
      items: estrutura.itens ?? [],
    };
    return mapOmieToUpsertInput(omieResult);
  });
  app.decorate("productStructureComputeHash", (upsertBase: any) => {
    return computeStructureHash({
      codProduto: upsertBase.codProduto,
      items: upsertBase.items.map((it: any) => ({
        codProdutoComponente: it.codProdutoComponente,
        quantidade: it.quantidade,
        unidade: it.unidade,
        percentualPerda: it.percentualPerda,
        idMalhaOmie: it.idMalhaOmie ?? null,
      })),
    });
  });

  await app.register(productStructureRoutes);
}