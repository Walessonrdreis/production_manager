import { SyncProductStructureInput, SyncProductStructureResult } from "../dtos/sync-product-structure.input";
import { OmieProductStructureGateway } from "../ports/omie-product-structure.gateway";
import { ProductStructureRepository } from "../ports/product-structure.repository";
import { resolveProductIdentifier } from "../utils/resolve-product-identifier";
import { mapOmieToUpsertInput } from "../utils/omie-mappers";
import { computeStructureHash } from "../utils/compute-structure-hash";

type Deps = {
  gateway: OmieProductStructureGateway;
  repository: ProductStructureRepository;
};

export class SyncOmieProductStructureUseCase {
  constructor(private deps: Deps) {}

  async execute(input: SyncProductStructureInput): Promise<SyncProductStructureResult> {
    const resolved = resolveProductIdentifier(input);

    const omieResult = await this.deps.gateway.fetchStructure({
      codProduto: resolved.kind === "codProduto" ? resolved.codProduto : undefined,
      idProduto: resolved.kind === "idProduto" ? resolved.idProduto : undefined,
      intProduto: resolved.kind === "intProduto" ? resolved.intProduto : undefined,
    });

    const upsertBase = mapOmieToUpsertInput(omieResult);

    // Idempotência: hash do estado
    const structureHash = computeStructureHash({
      codProduto: upsertBase.codProduto,
      items: upsertBase.items.map((i) => ({
        codProdutoComponente: i.codProdutoComponente,
        quantidade: i.quantidade,
        unidade: i.unidade,
        percentualPerda: i.percentualPerda,
        idMalhaOmie: i.idMalhaOmie ?? null,
      })),
    });

    const existing = await this.deps.repository.findByCodProduto(upsertBase.codProduto);

    if (existing?.structureHash && existing.structureHash === structureHash) {
      // NO-OP idempotente
      return {
        codProduto: upsertBase.codProduto,
        hasStructure: upsertBase.hasStructure,
        updated: false,
        itemsCount: upsertBase.items.length,
      };
    }

    await this.deps.repository.upsertStructureWithItems({
      ...upsertBase,
      structureHash,
    });

    return {
      codProduto: upsertBase.codProduto,
      hasStructure: upsertBase.hasStructure,
      updated: true,
      itemsCount: upsertBase.items.length,
    };
  }
}