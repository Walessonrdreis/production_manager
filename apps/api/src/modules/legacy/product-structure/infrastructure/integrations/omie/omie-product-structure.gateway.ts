import type {
  OmieProductStructureGateway,
  OmieProductStructureResult,
  ProductIdentifierInput,
} from "../../../application/ports/omie-product-structure.gateway";
import type {
  OmieListarEstruturasResponse,
  OmieEstrutura,
} from "./omie-product-structure.contracts";

type OmieHttpClient = {
  post: <T>(path: string, payload: any) => Promise<T>;
};

function extractEstruturas(resp: OmieListarEstruturasResponse): OmieEstrutura[] {
  return (
    resp.produtosEncontrados ??
    resp.listaEstruturas ??
    resp.estruturas ??
    resp.lista ??
    []
  );
}

function isOmieErrorResponse(resp: any): boolean {
  return Boolean(resp?.faultstring) || resp?.status === "error";
}

function safeJsonParse(raw: string): any | null {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function parseRetryAfterSecondsFromFault(faultstring?: string): number | null {
  if (!faultstring) return null;
  const m = faultstring.match(/Aguarde\s+(\d+)\s+segundos/i);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

function isRedundantFault(faultstring?: string): faultstring is string {
  return typeof faultstring === "string" && /REDUNDANT/i.test(faultstring);
}

function buildOmieFaultError(message: string, details: any) {
  const err = new Error(message);
  (err as any).code = "OMIE_FAULT";
  (err as any).details = details;
  return err;
}

function buildOmieRedundantError(faultstring: string, details: any) {
  const retryAfterSeconds = parseRetryAfterSecondsFromFault(faultstring) ?? 60;
  const err = new Error(faultstring);
  (err as any).code = "OMIE_REDUNDANT";
  (err as any).retryAfterSeconds = retryAfterSeconds;
  (err as any).details = details;
  return err;
}

export class OmieProductStructureGatewayImpl implements OmieProductStructureGateway {
  constructor(private readonly client: OmieHttpClient) {}

  /**
   * ✅ Método para JOB: lista UMA página de estruturas
   * - 1 chamada Omie por execução
   * - reduz chance de REDUNDANT
   */
  async listStructuresPage(page: number, pageSize: number): Promise<{
    page: number;
    totalPages: number | null;
    estruturas: OmieEstrutura[];
  }> {
    const payload = {
      call: "ListarEstruturas",
      param: [{ nPagina: page, nRegPorPagina: pageSize }],
    };

    let resp: OmieListarEstruturasResponse;

    try {
      resp = await this.client.post<OmieListarEstruturasResponse>("/api/v1/geral/malha/", payload);
    } catch (e: any) {
      if (e?.code === "OMIE_HTTP_ERROR" && e?.details?.sample) {
        const parsed = safeJsonParse(String(e.details.sample));
        const faultstring = parsed?.faultstring ?? parsed?.message;

        if (isRedundantFault(faultstring)) {
          throw buildOmieRedundantError(faultstring, {
            httpStatus: e?.details?.httpStatus,
            url: e?.details?.url,
            call: "ListarEstruturas",
            faultcode: parsed?.faultcode,
            faultstring,
          });
        }

        if (parsed?.faultstring || parsed?.status === "error") {
          throw buildOmieFaultError(
            parsed?.faultstring || parsed?.message || "Erro Omie ao listar estruturas",
            { httpStatus: e?.details?.httpStatus, url: e?.details?.url, call: "ListarEstruturas", sample: parsed }
          );
        }
      }
      throw e;
    }

    if (isOmieErrorResponse(resp)) {
      const faultstring = (resp as any)?.faultstring || (resp as any)?.message || "Erro Omie ao listar estruturas";
      if (isRedundantFault(faultstring)) {
        throw buildOmieRedundantError(faultstring, {
          call: "ListarEstruturas",
          faultcode: (resp as any)?.faultcode,
          faultstring,
          nPagina: (resp as any)?.nPagina,
        });
      }
      throw buildOmieFaultError(faultstring, resp);
    }

    const estruturas = extractEstruturas(resp);
    const totalPages = typeof resp.nTotPaginas === "number" ? resp.nTotPaginas : null;

    return {
      page: typeof resp.nPagina === "number" ? resp.nPagina : page,
      totalPages,
      estruturas,
    };
  }

  /**
   * ✅ Método do endpoint manual (continua existindo)
   * Busca uma estrutura específica via listagem + filtro em memória.
   */
  async fetchStructure(input: ProductIdentifierInput): Promise<OmieProductStructureResult> {
    const maxPages = 50;
    const pageSize = 100;
    let page = 1;

    const wantedCod = input.codProduto?.trim();
    const wantedId = typeof input.idProduto === "number" ? input.idProduto : undefined;
    const wantedInt = input.intProduto?.trim();

    while (page <= maxPages) {
      const { estruturas, totalPages } = await this.listStructuresPage(page, pageSize);

      const found = estruturas.find((e) => {
        const ident = e.ident;
        if (!ident) return false;
        if (wantedCod) return (ident.codProduto ?? "").trim() === wantedCod;
        if (wantedId) return ident.idProduto === wantedId;
        if (wantedInt) return (ident as any).intProduto?.trim?.() === wantedInt;
        return false;
      });

      if (found) {
        const ident = found.ident;
        const itens = found.itens ?? [];

        return {
          parent: {
            codProduto: ident.codProduto,
            descrProduto: ident.descrProduto,
            codFamilia: ident.codFamilia,
            descrFamilia: ident.descrFamilia,
            idProduto: ident.idProduto,
            idFamilia: ident.idFamilia,
            tipoProduto: ident.tipoProduto,
            unidProduto: ident.unidProduto,
            pesoBrutoProduto: ident.pesoBrutoProduto,
            pesoLiqProduto: ident.pesoLiqProduto,
            intProduto: (ident as any).intProduto,
          },
          items: itens.map((i) => ({
            codProdMalha: i.codProdMalha,
            descrProdMalha: i.descrProdMalha,
            codFamMalha: i.codFamMalha,
            descrFamMalha: i.descrFamMalha,
            quantProdMalha: i.quantProdMalha,
            unidProdMalha: i.unidProdMalha,
            tipoProdMalha: i.tipoProdMalha,
            percPerdaProdMalha: i.percPerdaProdMalha,
            idMalha: i.idMalha,
            idProdMalha: i.idProdMalha,
            idFamMalha: i.idFamMalha,
          })),
        };
      }

      if (typeof totalPages === "number" && page >= totalPages) break;
      if (!totalPages && estruturas.length === 0) break;

      page++;
    }

    const err = new Error(
      wantedCod
        ? `Estrutura não encontrada na Omie para codProduto=${wantedCod}`
        : wantedId
          ? `Estrutura não encontrada na Omie para idProduto=${wantedId}`
          : `Estrutura não encontrada na Omie para intProduto=${wantedInt}`
    );
    (err as any).code = "OMIE_NOT_FOUND";
    throw err;
  }
}