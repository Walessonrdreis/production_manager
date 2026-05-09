// src/modules/omie-orders/application/use-cases/list-production-orders-page.usecase.ts
import { AppError } from "@/shared/errors/AppError";
import { OMIE_ENDPOINTS } from "@/shared/integrations/omie/omie.constants";

export type OmieListProductionOrdersResponse = {
  pagina: number;
  total_de_paginas: number;
  registros?: number;
  total_de_registros?: number;
  cadastros?: any[];
};

export function createListProductionOrdersPageUseCase(deps: {
  omieClient: { post: <T>(path: string, payload: any) => Promise<T> };
  logger?: {
    info: (msg: string, meta?: any) => void;
    warn: (msg: string, meta?: any) => void;
  };
}) {
  return {
    async execute(input: { 
      page: number; 
      pageSize: number;
      filterCompleted?: boolean;
      filterCompletionDateStart?: string;
      filterCompletionDateEnd?: string;
    }) {
      const { page, pageSize, filterCompleted, filterCompletionDateStart, filterCompletionDateEnd } = input;

      try {
        const endpoint = OMIE_ENDPOINTS.PRODUCTION_ORDERS;
        
        const params: any[] = [
          { pagina: page },
          { registros_por_pagina: pageSize },
        ];

        if (filterCompleted !== undefined) {
          params.push({ cConcluida: filterCompleted ? 'S' : 'N' });
        }

        if (filterCompletionDateStart) {
          params.push({ dDtConclusaoDe: filterCompletionDateStart });
        }

        if (filterCompletionDateEnd) {
          params.push({ dDtConclusaoAte: filterCompletionDateEnd });
        }

        const payload = { call: endpoint.call, param: params };

        if (deps.logger) {
          deps.logger.info(`[OMIE] Listando ordens de produção página ${page}`, {
            endpoint: endpoint.path,
            call: endpoint.call,
            params,
          });
        }

        const resp = await deps.omieClient.post<OmieListProductionOrdersResponse>(endpoint.path, payload);
        
        return { 
          resp, 
          resolvedOmieEndpoint: { path: endpoint.path, call: endpoint.call } 
        };
      } catch (err: any) {
        if (err instanceof AppError) throw err;

        throw new AppError("OMIE_LIST_PRODUCTION_ORDERS_FAILED", 502, "Falha ao listar ordens de produção do Omie", {
          message: err?.message,
          stack: err?.stack,
        });
      }
    },
  };
}