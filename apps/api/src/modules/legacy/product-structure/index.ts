import type { FastifyInstance } from "fastify";
import { productStructureRoutes } from "./presentation/http/routes";
import { ProductStructurePrismaRepository } from "./infrastructure/db/prisma/product-structure.prisma-repository";
import { OmieProductStructureGatewayImpl } from "./infrastructure/integrations/omie/omie-product-structure.gateway";
import { SyncOmieProductStructureUseCase } from "./application/use-cases/sync-omie-product-structure.usecase";
import { GetProductStructureByCodProdutoUseCase } from "./application/use-cases/get-product-structure-by-codproduto.usecase";
import { ListProductStructuresUseCase } from "./application/use-cases/list-product-structures.usecase";
import { mapOmieToUpsertInput } from "./application/utils/omie-mappers";
import { computeStructureHash } from "./application/utils/compute-structure-hash";

declare module "fastify" {
  interface FastifyInstance {
    productStructure: {
      syncUseCase: SyncOmieProductStructureUseCase;
      getByCodProdutoUseCase: GetProductStructureByCodProdutoUseCase;
      listUseCase: ListProductStructuresUseCase;
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
  app.log.info("[product-structure] registering module...");

  try {
    const repository = new ProductStructurePrismaRepository(app.prisma);
    const gateway = new OmieProductStructureGatewayImpl(app.omieClient);

    const syncUseCase = new SyncOmieProductStructureUseCase({ gateway, repository });
    const getByCodProdutoUseCase = new GetProductStructureByCodProdutoUseCase({ repository });
    const listUseCase = new ListProductStructuresUseCase({ repository });

    app.decorate("productStructure", { syncUseCase, getByCodProdutoUseCase, listUseCase });

    app.decorate("productStructureInFlight", new Map<string, Promise<any>>());
    app.decorate("omieMalhaRateLimit", { blockedUntil: 0 });

    app.decorate("productStructureSyncJobState", {
      page: 1,
      blockedUntil: 0,
      pageSize: 100,
      maxPages: 50,
    });

    app.decorate("productStructureGateway", gateway);
    app.decorate("productStructureRepository", repository);
    app.decorate("productStructureMapOmieToUpsert", (estrutura: any) => {
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

    app.log.info("[product-structure] module decorated successfully");

    await productStructureRoutes(app);
    app.log.info("[product-structure] routes registered successfully");
  } catch (err) {
    app.log.error({ err }, "[product-structure] FAILED to register module");
    throw err;
  }
}