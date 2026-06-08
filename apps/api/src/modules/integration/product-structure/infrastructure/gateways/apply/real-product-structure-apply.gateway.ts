import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";
import type {
  ProductStructureApplyGateway,
  ApplyProductStructureItem,
  ApplyProductStructureResult,
} from "../../../application/ports/product-structure-apply.gateway";

export class RealProductStructureApplyGateway implements ProductStructureApplyGateway {
  constructor(private readonly omieClient: OmieHttpClientPort) {}

  async apply(productCode: string, items: ApplyProductStructureItem[]): Promise<ApplyProductStructureResult> {
    // 1) Descobre se já existe estrutura no Omie
    const current = await this.omieClient.post<any>("produto/estrutura/", {
      call: "ConsultarEstrutura",
      param: [{ codigo_produto: productCode }],
    });

    const hasAny = Array.isArray(current?.itens) && current.itens.length > 0;

    // 2) Decide método Omie (Incluir vs Alterar)
    const call = hasAny ? "AlterarEstrutura" : "IncluirEstrutura";

    // 3) Monta payload para Omie
    // TODO: Ajustar campos conforme contrato real do Omie (nomes e estrutura do payload)
    const payload = {
      codigo_produto: productCode,
      itens: items.map((i) => ({
        codigo_produto_componente: i.componentCode,
        quantidade: i.quantity,
        unidade: i.unit,
        percentual_perda: i.loss,
      })),
    };

    const response = await this.omieClient.post<any>("produto/estrutura/", {
      call,
      param: [payload],
    });

    return {
      productCode,
      applied: true,
      rawPayload: response,
    };
  }
}