import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";
import type {
  ProductStructureDeleteGateway,
  DeleteProductStructureResult,
} from "../../../application/ports/product-structure-delete.gateway";

export class RealProductStructureDeleteGateway implements ProductStructureDeleteGateway {
  constructor(private readonly omieClient: OmieHttpClientPort) { }

  async delete(productCode: string): Promise<DeleteProductStructureResult> {
    if (!productCode || typeof productCode !== "string" || productCode.trim() === "") {
      throw new Error("Invalid delete: productCode must be a non-empty string");
    }

    const response = await this.omieClient.post<any>("produto/estrutura/", {
      call: "ExcluirEstrutura",
      param: [{ codProduto: productCode }],
    });

    return {
      productCode,
      deleted: true,
      rawPayload: response,
    };
  }
}