import { AppError } from "@/shared/errors/AppError";

const OMIE_PRODUCTS_PATH = "geral/produtos/";
const OMIE_PRODUCTS_PAGE_SIZE = 100;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createFetchOmieProductsPageUseCase(deps: {
  omieClient: { post: <T>(path: string, payload: any) => Promise<T> };
  logger?: { warn?: (obj: any, msg?: string) => void };
}) {
  const log = deps.logger ?? {};

  function buildPayload(page: number) {
    return {
      call: "ListarProdutos",
      param: [
        {
          pagina: page,
          registros_por_pagina: OMIE_PRODUCTS_PAGE_SIZE,
          apenas_importado_api: "N",
          filtrar_apenas_omiepdv: "N",
        },
      ],
    };
  }

  function extractItems(data: any): any[] {
    return (
      data?.produto_servico_cadastro ??
      data?.produtos ??
      data?.lista ??
      data?.produto_servico ??
      []
    );
  }

  function extractTotalPages(data: any): number | null {
    const value =
      data?.total_de_paginas ??
      data?.nTotPaginas ??
      data?.nTotalPaginas ??
      data?.total_paginas;

    if (value === undefined || value === null || value === "") return null;

    const totalPages = Number(value);
    return Number.isFinite(totalPages) && totalPages > 0 ? totalPages : null;
  }

  async function fetchWithRetry(page: number, requestId: string) {
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await deps.omieClient.post<any>(OMIE_PRODUCTS_PATH, buildPayload(page));
      } catch (error: any) {
        if (attempt >= maxAttempts) {
          if (error instanceof AppError) {
            throw new AppError(error.code, error.statusCode, error.message, {
              ...(error.details || {}),
              page,
              attempt,
              requestId,
            });
          }
          throw error;
        }

        log.warn?.({ requestId, page, attempt }, "omie products page retry");
        await sleep(250 * attempt);
      }
    }

    throw new AppError("OMIE_PAGINATION_ERROR", 502, "Falha ao paginar produtos no Omie", {
      page,
      requestId,
    });
  }

  return {
    pageSize: OMIE_PRODUCTS_PAGE_SIZE,

    async execute(input: { page: number; requestId: string }) {
      const data = await fetchWithRetry(input.page, input.requestId);
      const items = extractItems(data);
      const totalPages = extractTotalPages(data);

      return { items, totalPages };
    },
  };
}