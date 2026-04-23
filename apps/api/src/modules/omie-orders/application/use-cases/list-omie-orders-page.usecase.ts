// src/modules/omie-orders/application/use-cases/list-omie-orders-page.usecase.ts
import { AppError } from "@/shared/errors/AppError";
import { OMIE_ENDPOINTS } from "@/shared/integrations/omie";

export type OmieListOrdersResponse = {
  pagina: number;
  total_de_paginas: number;
  registros?: number;
  total_de_registros?: number;
  pedido_venda_produto?: any[];
};

export function createListOmieOrdersPageUseCase(deps: {
  omieClient: { post: <T>(path: string, payload: any) => Promise<T> };
}) {
  return {
    async execute(input: { page: number; pageSize: number }) {
      const { page, pageSize } = input;

      try {
        const candidates: Array<{ path: string; call: string }> = [
          {
            path: OMIE_ENDPOINTS.SALES_ORDERS_PRODUCTS.path,
            call: OMIE_ENDPOINTS.SALES_ORDERS_PRODUCTS.call,
          },
          { path: "produtos/pedido/", call: "ListarPedidos" },
        ];

        for (const candidate of candidates) {
          const paramCandidates = [
            { pagina: page, registros_por_pagina: pageSize, etapa: "20" },
            { pagina: page, registros_por_pagina: pageSize },
          ];

          for (const param of paramCandidates) {
            const payload = { call: candidate.call, param: [param] };

            try {
              const resp = await deps.omieClient.post<OmieListOrdersResponse>(candidate.path, payload);
              return { resp, resolvedOmieEndpoint: { path: candidate.path, call: candidate.call } };
            } catch (err: any) {
              const isHttpError = err instanceof AppError && err.code === "OMIE_HTTP_ERROR";
              const httpStatus = isHttpError ? (err.details as any)?.httpStatus : undefined;
              const body = isHttpError ? String((err.details as any)?.sample ?? (err.details as any)?.body ?? "") : "";

              const bodyLower = body.toLowerCase();
              const methodNotExists = bodyLower.includes("not exists") || bodyLower.includes("não existe");

              // endpoint/call não existe -> tenta próximo candidato
              if (isHttpError && (httpStatus === 404 || methodNotExists)) {
                break;
              }

              // param inválido -> tenta o próximo paramCandidate
              if (isHttpError && httpStatus === 500 && bodyLower.includes("invalid")) {
                continue;
              }

              throw err;
            }
          }
        }

        throw new AppError("OMIE_LIST_ORDERS_FAILED", 502, "Falha ao listar pedidos do Omie", {
          attempts: candidates.map((c) => ({ path: c.path, call: c.call })),
        });
      } catch (err: any) {
        if (err instanceof AppError) throw err;

        throw new AppError("OMIE_LIST_ORDERS_FAILED", 502, "Falha ao listar pedidos do Omie", {
          message: err?.message,
        });
      }
    },
  };
}