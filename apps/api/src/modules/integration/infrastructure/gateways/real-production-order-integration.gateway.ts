import { ProductionOrderIntegrationGateway } from "../../application/ports/production-order-integration.gateway";
import { CreateProductionOrderRequest } from "../../presentation/http/schemas";
import { env } from "@/config";
import type { OmieClientWithCircuitBreaker } from "@/shared/integrations/omie/omie-client-with-circuit-breaker";

export class RealProductionOrderIntegrationGateway
  implements ProductionOrderIntegrationGateway
{
  constructor(
    private readonly omieClient: OmieClientWithCircuitBreaker
  ) {
    // Gateway ativo para integração real com Omie
  }

  async createProductionOrder(
    command: CreateProductionOrderRequest
  ): Promise<{
    externalRequestId: string;
    status: "ACCEPTED";
  }> {
    // Valida campos obrigatórios antes da chamada
    this.validateRequiredFields(command);

    // Prepara payload real de Ordem de Produção conforme API Omie
    const payload = {
      call: "IncluirOrdemProducao",
      app_key: env.OMIE_APP_KEY,
      app_secret: env.OMIE_APP_SECRET,
      param: [
        {
          identificacao: {
            cCodIntOP: command.externalRequestId,
            dDtPrevisao: command.scheduledDate ? this.formatDate(command.scheduledDate) : this.getCurrentDate(),
            nCodProduto: Number(command.productId),
            nQtde: command.quantity,
          },
        },
      ],
    };

    // Chamada real à API Omie
    try {
      const apiResponse = await this.omieClient.post<any>("/api/v1/produtos/op/", payload);
      
      // Normalizar retorno para suportar tanto payload direto quanto .data (axios-like)
      const response = (apiResponse && typeof apiResponse === "object" && "data" in apiResponse)
        ? (apiResponse as any).data
        : apiResponse;
      
      // Verificar se a resposta contém erro (sem falso positivo)
      if (response.faultstring || response.error || (response.codigo_status && response.codigo_status !== "0")) {
        console.error('[OmieIntegrationError]', response);
        throw new Error(`Omie API error: ${response.faultstring || response.error || 'Unknown error'}`);
      }
      
      // Retorno obrigatório conforme contrato
      return { externalRequestId: command.externalRequestId, status: "ACCEPTED" };
    } catch (error: unknown) {
      console.error("[OMIE ERROR FULL]", error);

      let message = "Omie unknown error";

      if (typeof error === "object" && error !== null) {
        const anyErr = error as any;

        // Alguns clients colocam retorno em error.response.data
        if (anyErr.response?.data?.faultstring) message = anyErr.response.data.faultstring;
        else if (anyErr.response?.data?.error) message = anyErr.response.data.error;
        else if (anyErr.message) message = anyErr.message;
      }

      throw new Error(message);
    }

  }

  private formatDate(date: string): string {
    // Converte ISO string para DD/MM/YYYY
    const parsedDate = new Date(date);
    const day = String(parsedDate.getDate()).padStart(2, '0');
    const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const year = parsedDate.getFullYear();
    return `${day}/${month}/${year}`;
  }

  private getCurrentDate(): string {
    // Data atual no formato DD/MM/YYYY
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    return `${day}/${month}/${year}`;
  }

  private validateRequiredFields(command: CreateProductionOrderRequest): void {
    const missingFields: string[] = [];

    if (!command.productId || command.productId.trim() === "") {
      missingFields.push("productId");
    }

    if (!command.quantity || command.quantity <= 0) {
      missingFields.push("quantity");
    }

    if (!command.externalRequestId || command.externalRequestId.trim() === "") {
      missingFields.push("externalRequestId");
    }

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
    }
  }
}