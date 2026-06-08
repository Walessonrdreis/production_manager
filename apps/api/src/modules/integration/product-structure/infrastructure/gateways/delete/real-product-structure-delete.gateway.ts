import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";
import type {
  ProductStructureDeleteGateway,
  DeleteProductStructureResult,
} from "../../../application/ports/product-structure-delete.gateway";

export class RealProductStructureDeleteGateway implements ProductStructureDeleteGateway {
  constructor(private readonly omieClient: OmieHttpClientPort) {}

  async delete(productCode: string): Promise<DeleteProductStructureResult> {
    // TODO: Ajustar payload conforme contrato real do Omie
    const response = await this.omieClient.post<any>("produto/estrutura/", {
      call: "ExcluirEstrutura",
      param: [{ codigo_produto: productCode }],
    });

    return {
      productCode,
      deleted: true,
      rawPayload: response,
    };
  }
}