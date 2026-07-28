import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";
import type {
  ProductStructureApplyGateway,
  ApplyProductStructureItem,
  ApplyProductStructureResult,
} from "../../../application/ports/product-structure-apply.gateway";

function validateApplyItems(items: ApplyProductStructureItem[]): void {
  for (const item of items) {
    if (!item.componentCode || typeof item.componentCode !== "string" || item.componentCode.trim() === "") {
      throw new Error(`Invalid apply item: componentCode is required and must be a non-empty string (got ${JSON.stringify(item.componentCode)})`);
    }
    const qty = typeof item.quantity === "string" ? Number(item.quantity) : item.quantity;
    if (qty == null || isNaN(qty) || qty <= 0) {
      throw new Error(`Invalid apply item for component "${item.componentCode}": quantity must be a positive number (got ${JSON.stringify(item.quantity)})`);
    }
  }
}

export class RealProductStructureApplyGateway implements ProductStructureApplyGateway {
  constructor(private readonly omieClient: OmieHttpClientPort) { }

  async apply(productCode: string, items: ApplyProductStructureItem[]): Promise<ApplyProductStructureResult> {
    // Valida payload antes de enviar ao Omie
    validateApplyItems(items);

    // 1) Descobre se já existe estrutura no Omie
    const current = await this.omieClient.post<any>("produto/estrutura/", {
      call: "ConsultarEstrutura",
      param: [{ codProduto: productCode }],
    });

    const hasAny = Array.isArray(current?.itens) && current.itens.length > 0;

    // 2) Decide método Omie (Incluir vs Alterar)
    const call = hasAny ? "AlterarEstrutura" : "IncluirEstrutura";

    // 3) Monta payload com campos no padrão Omie
    const payload = {
      codProduto: productCode,
      itens: items.map((i) => ({
        codProdMalha: i.componentCode,
        quantProdMalha: typeof i.quantity === "string" ? Number(i.quantity) : i.quantity,
        unidProdMalha: i.unit || null,
        percPerdaProdMalha: i.loss != null ? (typeof i.loss === "string" ? Number(i.loss) : i.loss) : null,
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