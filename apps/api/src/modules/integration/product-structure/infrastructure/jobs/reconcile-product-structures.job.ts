import { prisma } from "@/shared/db/prisma";
import { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";
import { RealProductStructureFetchGateway } from "../gateways/fetch/real-product-structure-fetch.gateway";
import { ProductStructureIntegrationStore } from "../db/product-structure-integration.store";

export class ReconcileProductStructuresJob {
  constructor(
    private readonly omieClient: OmieHttpClientPort,
    private readonly store: ProductStructureIntegrationStore
  ) {}

  async execute(): Promise<void> {
    let page = 1;
    const perPage = 100;

    while (true) {
      const response = await this.omieClient.post<any>("produto/estrutura/", {
        call: "ListarEstruturas",
        param: [
          {
            nPagina: page,
            nRegPorPagina: perPage,
          },
        ],
      });

      const produtos = response?.produtosEncontrados ?? [];
      if (produtos.length === 0) break;

      const fetchGateway = new RealProductStructureFetchGateway(this.omieClient);

      for (const produto of produtos) {
        const productCode = produto.ident?.codProduto;
        if (!productCode) continue;

        const result = await fetchGateway.fetchByProductCode(productCode);
        await this.store.save(result);
      }

      page += 1;
      if (page > (response?.nTotPaginas ?? page)) break;
    }
  }
}