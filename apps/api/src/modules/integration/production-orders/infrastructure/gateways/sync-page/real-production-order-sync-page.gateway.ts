// ---------------------------------------------------------------------------
// Gateway Real — Busca página de ordens de produção da Omie
// ---------------------------------------------------------------------------
// Segue o padrão de RealProductStructureFetchPageGateway.
// Usa OmieHttpClientPort + OmieProductionOrdersAdapter.
// ---------------------------------------------------------------------------

import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";
import { OMIE_ENDPOINTS } from "@/shared/integrations/omie/omie.constants";
import { mapProductionOrder } from "@/shared/integrations/omie/OmieProductionOrdersAdapter";

import type {
  ProductionOrderSyncPageGateway,
  ProductionOrderSyncPageInput,
  ProductionOrderSyncPageResult,
  ProductionOrderSyncPageItem,
} from "../../../application/ports/production-order-sync-page.gateway";

export class RealProductionOrderSyncPageGateway
  implements ProductionOrderSyncPageGateway
{
  constructor(private readonly omieClient: OmieHttpClientPort) {}

  async fetchPage(
    input: ProductionOrderSyncPageInput
  ): Promise<ProductionOrderSyncPageResult> {
    const { page, pageSize, updatedSince } = input;

    const params: any[] = [
      { pagina: page },
      { registros_por_pagina: pageSize },
    ];

    if (updatedSince) {
      // Filtra por data de conclusão (incremental)
      const dateStr = updatedSince.toISOString().split("T")[0]; // YYYY-MM-DD
      params.push({ dDtConclusaoDe: dateStr });
    }

    const response = await this.omieClient.post<any>(
      OMIE_ENDPOINTS.PRODUCTION_ORDERS.path,
      {
        call: OMIE_ENDPOINTS.PRODUCTION_ORDERS.call,
        param: params,
      }
    );

    const cadastros = Array.isArray(response?.cadastros)
      ? response.cadastros
      : [];

    const totalPages =
      response?.total_de_paginas != null
        ? Number(response.total_de_paginas)
        : null;

    const items: ProductionOrderSyncPageItem[] = cadastros.map(
      (entry: any): ProductionOrderSyncPageItem => {
        const { order } = mapProductionOrder(entry);

        const identificacao = entry?.identificacao ?? {};
        const infAdicionais = entry?.infAdicionais ?? {};
        const outrasInf = entry?.outrasInf ?? {};

        return {
          omieCode: order.omieCode,
          number: String(identificacao.cNumOP ?? ""),
          internalCode: order.internalCode,
          productCode: Number(identificacao.nCodProduto ?? 0),
          quantity: Number(order.quantity),
          stage: order.stage,
          completed: order.completed,
          forecastDate: order.forecastDate,
          completionDate: order.completionDate,
          startDate: order.startDate,
          stockLocationCode:
            infAdicionais.codigo_local_estoque != null
              ? Number(infAdicionais.codigo_local_estoque)
              : null,
          raw: entry,
        };
      }
    );

    return {
      items,
      hasNextPage: totalPages != null ? page < totalPages : items.length > 0,
      totalPages,
      currentPage: page,
    };
  }
}
